// TJ-ARCH-MOB-001 compliant
//! The site-wide spend ceiling (site-spend-ceiling, FR-36, FR-38).
//!
//! Every chat turn (titles included) passes, in order: the per-IP limiter
//! (route layer, first), request validation, the kill switch, then a
//! reservation of `n` tokens against the daily and monthly counters. Only
//! an admitted turn reaches UAR. When the turn ends, a [`TurnTracker`]
//! settles the reservation to the usage in `agui.done` and writes the FR-38
//! record; a turn without usage keeps its full reservation.
//!
//! Alerts are structured log lines with a stable `alert` field, the channel
//! the operator wires to the provider-side spend alert (the crate exposes no
//! metrics endpoint):
//! - `meter_budget_warning` (WARN): a counter passed 80% of its budget;
//! - `meter_budget_exhausted` (ERROR): a counter reached its budget, or a
//!   turn was refused for it (once per period row per replica);
//! - `meter_excess` (WARN): a settlement charged more than its reservation;
//! - `meter_unavailable` (ERROR): the store failed, turns refused;
//! - `meter_settlement_failed` (ERROR): a turn's reservation could not be
//!   settled and stays charged in full.

use std::sync::{Arc, Mutex};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use crate::domain::agui_filter::Signal;
use crate::domain::meter::{
    Budgets, Crossing, Outcome, PeriodKind, Periods, ReserveResult, Totals, TurnRecord, Usage,
    crossings,
};
use crate::error::AppError;
use crate::infrastructure::kill_switch::KillSwitch;
use crate::infrastructure::meter_store::MeterStore;

/// What an admitted turn reserved, kept for its settlement.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Reservation {
    pub periods: Periods,
    pub tokens: u64,
}

#[derive(Debug)]
pub struct Meter {
    store: MeterStore,
    budgets: Budgets,
    reservation_tokens: u64,
    kill_switch: Arc<KillSwitch>,
    /// Last row key for which `meter_budget_exhausted` was logged, per kind.
    exhausted_logged: Mutex<[Option<String>; 2]>,
}

impl Meter {
    pub fn new(
        store: MeterStore,
        budgets: Budgets,
        reservation_tokens: u64,
        kill_switch: Arc<KillSwitch>,
    ) -> Self {
        Self {
            store,
            budgets,
            reservation_tokens,
            kill_switch,
            exhausted_logged: Mutex::new([None, None]),
        }
    }

    /// Admits a turn or refuses it with an offline state. Fails closed: any
    /// store error refuses the turn.
    pub async fn admit(&self) -> Result<Reservation, AppError> {
        if self.kill_switch.is_engaged() {
            return Err(AppError::KillSwitchOn);
        }
        let periods = Periods::at(unix_now());
        let n = self.reservation_tokens;
        match self.store.reserve(&periods, n, self.budgets).await {
            Ok(ReserveResult::Reserved(after)) => {
                self.alert_crossings(&periods, after, i128::from(n));
                Ok(Reservation { periods, tokens: n })
            }
            Ok(ReserveResult::Exhausted(kind)) => {
                self.log_exhausted(kind, &periods, "turn refused");
                Err(AppError::BudgetExhausted)
            }
            Err(err) => {
                tracing::error!(alert = "meter_unavailable", error = %err, "meter store failed; turn refused");
                Err(AppError::MeterUnavailable)
            }
        }
    }

    /// The tracker that settles `reservation` when the turn ends.
    pub fn tracker(self: &Arc<Self>, reservation: Reservation, accepted: Instant) -> TurnTracker {
        TurnTracker {
            meter: Arc::clone(self),
            reservation,
            accepted,
            ttft_ms: None,
            usage: None,
            outcome: None,
            finished: false,
        }
    }

    async fn settle(&self, record: TurnRecord) {
        if record.excess() > 0 {
            tracing::warn!(
                alert = "meter_excess",
                reserved = record.reserved,
                charged = record.charged,
                excess = record.excess(),
                "turn used more than its reservation"
            );
        }
        match self.store.settle(&record).await {
            Ok(after) => self.alert_crossings(&record.periods, after, record.delta()),
            Err(err) => tracing::error!(
                alert = "meter_settlement_failed",
                error = %err,
                reserved = record.reserved,
                charged = record.charged,
                outcome = record.outcome.as_str(),
                "settlement failed; the full reservation stays charged"
            ),
        }
    }

    fn alert_crossings(&self, periods: &Periods, after: Totals, delta: i128) {
        for kind in [PeriodKind::Day, PeriodKind::Month] {
            let budget = self.budgets.of(kind);
            let now = after.of(kind);
            let before = u64::try_from(i128::from(now) - delta).unwrap_or(0);
            for crossing in crossings(before, now, budget) {
                match crossing {
                    Crossing::Warning => tracing::warn!(
                        alert = "meter_budget_warning",
                        period = kind.as_str(),
                        total = now,
                        budget,
                        "token meter passed 80% of its budget"
                    ),
                    Crossing::Exhausted => self.log_exhausted(kind, periods, "budget reached"),
                }
            }
        }
    }

    fn log_exhausted(&self, kind: PeriodKind, periods: &Periods, reason: &str) {
        let key = match kind {
            PeriodKind::Day => &periods.day,
            PeriodKind::Month => &periods.month,
        };
        let slot = usize::from(kind == PeriodKind::Month);
        let mut logged = self
            .exhausted_logged
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        if logged[slot].as_deref() == Some(key.as_str()) {
            return;
        }
        logged[slot] = Some(key.clone());
        tracing::error!(
            alert = "meter_budget_exhausted",
            period = kind.as_str(),
            budget = self.budgets.of(kind),
            reason,
            "token meter budget exhausted"
        );
    }
}

/// Follows one admitted turn and settles it exactly once: at stream end, on
/// an upstream error, or, if dropped first (visitor disconnect), on drop.
#[derive(Debug)]
pub struct TurnTracker {
    meter: Arc<Meter>,
    reservation: Reservation,
    accepted: Instant,
    ttft_ms: Option<u64>,
    usage: Option<Usage>,
    outcome: Option<Outcome>,
    finished: bool,
}

impl TurnTracker {
    pub fn observe(&mut self, signal: &Signal) {
        match signal {
            Signal::Output => {
                if self.ttft_ms.is_none() {
                    let ms = self.accepted.elapsed().as_millis();
                    self.ttft_ms = Some(u64::try_from(ms).unwrap_or(u64::MAX));
                }
            }
            Signal::Done(usage) => {
                self.usage = usage.clone();
                self.outcome.get_or_insert(Outcome::Completed);
            }
            Signal::Cancelled => self.outcome = Some(Outcome::Cancelled),
            Signal::Error => {
                self.outcome.get_or_insert(Outcome::Failed);
            }
        }
    }

    /// Settles the turn. `fallback` is the outcome when no signal set one.
    pub fn finish(&mut self, fallback: Outcome) {
        if self.finished {
            return;
        }
        self.finished = true;
        let record = self.record(self.outcome.unwrap_or(fallback));
        let meter = Arc::clone(&self.meter);
        match tokio::runtime::Handle::try_current() {
            Ok(handle) => {
                handle.spawn(async move { meter.settle(record).await });
            }
            Err(_) => tracing::error!(
                alert = "meter_settlement_failed",
                reserved = record.reserved,
                "no runtime to settle on; the full reservation stays charged"
            ),
        }
    }

    fn record(&self, outcome: Outcome) -> TurnRecord {
        let usage = self.usage.clone().unwrap_or_default();
        TurnRecord {
            periods: self.reservation.periods.clone(),
            reserved: self.reservation.tokens,
            charged: usage.charged_tokens().unwrap_or(self.reservation.tokens),
            usage,
            ttft_ms: self.ttft_ms,
            outcome,
        }
    }
}

impl Drop for TurnTracker {
    fn drop(&mut self) {
        self.finish(Outcome::Disconnected);
    }
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_secs())
}
