// TJ-ARCH-MOB-001 compliant
//! The daily cap counter (task 16.2.3).
//!
//! In memory, behind a mutex, keyed on the UTC day. When a state file is
//! configured (`WEBSEARCH_CAP_STATE_FILE`, an `emptyDir` in the cluster), the
//! counter is written after every admitted search and read back at start-up,
//! so a container restart on the same pod (crash, OOM kill, liveness
//! failure) keeps the day's count.
//!
//! Known gap, recorded in design.md: an `emptyDir` lives as long as the
//! pod, so a new pod (rollout, eviction, node loss) starts the day at zero.
//! Worst case per UTC day is therefore `cap x (new pods that day + 1)`. The
//! Deployment runs one replica (the counter is per process); a second
//! replica would double the cap.
//!
//! File format: one line, `<utc-day> <used>`. A missing, unreadable or
//! malformed file starts at zero for today (logged as a fixed outcome code).
//! A failed write keeps counting in memory (logged); it never blocks a
//! search and never resets the in-memory count.

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, PoisonError};
use std::time::SystemTime;

use crate::application::search::UsageGate;
use crate::domain::cap::{Admission, CapState, utc_day};

/// Source of the current time; injected so tests can cross midnight UTC.
pub trait Clock: Send + Sync {
    fn now(&self) -> SystemTime;
}

#[derive(Debug, Clone, Copy, Default)]
pub struct SystemClock;

impl Clock for SystemClock {
    fn now(&self) -> SystemTime {
        SystemTime::now()
    }
}

pub struct DailyCounter {
    limit: u32,
    clock: Arc<dyn Clock>,
    state: Mutex<CapState>,
    state_file: Option<PathBuf>,
}

impl DailyCounter {
    pub fn new(limit: u32, clock: Arc<dyn Clock>, state_file: Option<PathBuf>) -> Self {
        let today = utc_day(clock.now());
        let initial = state_file
            .as_deref()
            .map_or(CapState::new(today), |path| load(path, today));
        Self {
            limit,
            clock,
            state: Mutex::new(initial),
            state_file,
        }
    }

    /// Today's state, for tests and diagnostics.
    pub fn snapshot(&self) -> CapState {
        *self.state.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

impl UsageGate for DailyCounter {
    fn try_admit(&self) -> Admission {
        let today = utc_day(self.clock.now());
        let mut guard = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        let (next, admission) = guard.admit(today, self.limit);
        *guard = next;
        if let (Admission::Admitted { .. }, Some(path)) = (admission, self.state_file.as_deref())
            && store(path, next).is_err()
        {
            tracing::warn!(outcome = "cap_state_write_failed", "daily cap");
        }
        admission
    }
}

fn load(path: &Path, today: u64) -> CapState {
    let fresh = CapState::new(today);
    let text = match std::fs::read_to_string(path) {
        Ok(text) => text,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return fresh,
        Err(_) => {
            tracing::warn!(outcome = "cap_state_read_failed", "daily cap");
            return fresh;
        }
    };
    match parse(&text) {
        Some(state) if state.day == today => {
            tracing::info!(
                outcome = "cap_state_restored",
                used_today = state.used,
                "daily cap"
            );
            state
        }
        Some(_) => fresh,
        None => {
            tracing::warn!(outcome = "cap_state_malformed", "daily cap");
            fresh
        }
    }
}

fn parse(text: &str) -> Option<CapState> {
    let mut fields = text.split_whitespace();
    let day = fields.next()?.parse().ok()?;
    let used = fields.next()?.parse().ok()?;
    fields.next().is_none().then_some(CapState { day, used })
}

/// Write-then-rename, so a crash mid-write leaves the previous file.
fn store(path: &Path, state: CapState) -> std::io::Result<()> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, format!("{} {}\n", state.day, state.used))?;
    std::fs::rename(&tmp, path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, UNIX_EPOCH};

    struct FixedClock(SystemTime);

    impl Clock for FixedClock {
        fn now(&self) -> SystemTime {
            self.0
        }
    }

    const DAY: u64 = 20_000;

    fn clock_on(day: u64) -> Arc<dyn Clock> {
        Arc::new(FixedClock(
            UNIX_EPOCH + Duration::from_secs(day * 86_400 + 3_600),
        ))
    }

    fn scratch_file(name: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir().join(format!(
            "site-websearch-{name}-{}-{unique}",
            std::process::id()
        ))
    }

    #[test]
    fn a_restart_on_the_same_day_should_keep_the_count() {
        let path = scratch_file("same-day");
        let first = DailyCounter::new(2, clock_on(DAY), Some(path.clone()));
        let _ = (first.try_admit(), first.try_admit());
        let restarted = DailyCounter::new(2, clock_on(DAY), Some(path.clone()));
        let admission = restarted.try_admit();
        let _ = std::fs::remove_file(&path);
        assert_eq!(admission, Admission::Exhausted);
    }

    #[test]
    fn a_restart_on_a_new_day_should_start_at_zero() {
        let path = scratch_file("new-day");
        let first = DailyCounter::new(2, clock_on(DAY), Some(path.clone()));
        let _ = (first.try_admit(), first.try_admit());
        let restarted = DailyCounter::new(2, clock_on(DAY + 1), Some(path.clone()));
        let snapshot = restarted.snapshot();
        let _ = std::fs::remove_file(&path);
        assert_eq!(snapshot, CapState::new(DAY + 1));
    }

    #[test]
    fn a_malformed_state_file_should_start_at_zero() {
        let path = scratch_file("malformed");
        let _ = std::fs::write(&path, "not a counter");
        let counter = DailyCounter::new(2, clock_on(DAY), Some(path.clone()));
        let snapshot = counter.snapshot();
        let _ = std::fs::remove_file(&path);
        assert_eq!(snapshot, CapState::new(DAY));
    }

    #[test]
    fn without_a_state_file_the_count_should_live_in_memory() {
        let counter = DailyCounter::new(1, clock_on(DAY), None);
        assert_eq!(
            (counter.try_admit(), counter.try_admit()),
            (Admission::Admitted { used: 1 }, Admission::Exhausted)
        );
    }
}
