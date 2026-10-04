// TJ-ARCH-MOB-001 compliant
//! Reserve-and-settle token meter policy (site-spend-ceiling, FR-36, FR-38).
//!
//! Pure parts only: UTC period keys, the SurrealQL the store runs, parsing
//! its answers, reading usage from `agui.done`, and budget-crossing alerts.
//!
//! Counters are rows `meter:day_YYYY_MM_DD` and `meter:month_YYYY_MM`,
//! created on first use with `UPSERT … SET total += 0` and never reused by a
//! later period (1.13). A reservation adds `n` to both rows in one
//! transaction, each only `WHERE total + n <= budget`. SurrealQL returns an
//! empty result, not an error, for an `UPDATE` that matches no row, so each
//! result is checked and an empty one `THROW`s, which cancels the whole
//! transaction: neither row is reserved.
//!
//! The SurrealQL text holds only values this module formats (period keys,
//! integers). Strings that come from UAR (the model name) and the outcome
//! are bound as query variables by the store client, never spliced in.

use serde_json::Value;

/// Marker in the THROW message; the store client matches on it.
pub const BUDGET_EXCEEDED_MARKER: &str = "meter_budget_exceeded";
/// Fraction of a budget at which the warning alert fires.
const WARN_NUMERATOR: u64 = 4;
const WARN_DENOMINATOR: u64 = 5;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PeriodKind {
    Day,
    Month,
}

impl PeriodKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Day => "day",
            Self::Month => "month",
        }
    }
}

/// The two counter rows a turn is admitted against. Recorded at reservation
/// and reused at settlement, so a turn that straddles a UTC boundary
/// settles to the period it was admitted in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Periods {
    pub day: String,
    pub month: String,
}

impl Periods {
    /// The UTC day and month containing `unix_secs`.
    pub fn at(unix_secs: u64) -> Self {
        let (year, month, day) = civil_from_days(unix_secs / 86_400);
        Self {
            day: format!("day_{year:04}_{month:02}_{day:02}"),
            month: format!("month_{year:04}_{month:02}"),
        }
    }
}

/// Days since 1970-01-01 to (year, month, day), proleptic Gregorian
/// (H. Hinnant, `civil_from_days`).
fn civil_from_days(days: u64) -> (u64, u64, u64) {
    let z = days + 719_468;
    let era = z / 146_097;
    let doe = z % 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + u64::from(month <= 2);
    (year, month, day)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Budgets {
    pub daily: u64,
    pub monthly: u64,
}

impl Budgets {
    pub fn of(self, kind: PeriodKind) -> u64 {
        match kind {
            PeriodKind::Day => self.daily,
            PeriodKind::Month => self.monthly,
        }
    }
}

/// Counter totals after a reservation or a settlement.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Totals {
    pub day: u64,
    pub month: u64,
}

impl Totals {
    pub fn of(self, kind: PeriodKind) -> u64 {
        match kind {
            PeriodKind::Day => self.day,
            PeriodKind::Month => self.month,
        }
    }
}

/// Reserve `n` on both rows, or neither.
pub fn reserve_query(periods: &Periods, n: u64, budgets: Budgets) -> String {
    let (day, month) = (&periods.day, &periods.month);
    format!(
        "BEGIN TRANSACTION;\n\
         UPSERT meter:{day} SET total += 0, period = 'day';\n\
         UPSERT meter:{month} SET total += 0, period = 'month';\n\
         LET $d = UPDATE meter:{day} SET total += {n} WHERE total + {n} <= {daily} RETURN AFTER;\n\
         IF array::len($d) = 0 {{ THROW '{BUDGET_EXCEEDED_MARKER}:day' }};\n\
         LET $m = UPDATE meter:{month} SET total += {n} WHERE total + {n} <= {monthly} RETURN AFTER;\n\
         IF array::len($m) = 0 {{ THROW '{BUDGET_EXCEEDED_MARKER}:month' }};\n\
         RETURN {{ day: $d[0].total, month: $m[0].total }};\n\
         COMMIT TRANSACTION;",
        daily = budgets.daily,
        monthly = budgets.monthly,
    )
}

/// How a metered turn ended (FR-38 `outcome`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    /// `agui.done` arrived.
    Completed,
    /// `agui.cancelled` arrived.
    Cancelled,
    /// `agui.error` arrived.
    Failed,
    /// The visitor disconnected before the stream ended.
    Disconnected,
    /// The stream ended without `agui.done`.
    Incomplete,
    /// UAR answered with a non-2xx, or could not be reached.
    UpstreamError,
}

impl Outcome {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Completed => "completed",
            Self::Cancelled => "cancelled",
            Self::Failed => "failed",
            Self::Disconnected => "disconnected",
            Self::Incomplete => "incomplete",
            Self::UpstreamError => "upstream_error",
        }
    }
}

/// `usage` from UAR's `agui.done` (UAR `src/uar/api/sse.rs`,
/// `RunDoneWithUsage`). Every field is optional upstream.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Usage {
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub total_tokens: Option<u64>,
    pub model: Option<String>,
}

impl Usage {
    /// Tokens to charge: `total_tokens`, else input + output when both are
    /// known. `None` keeps the full reservation.
    pub fn charged_tokens(&self) -> Option<u64> {
        self.total_tokens.or_else(|| {
            self.input_tokens
                .zip(self.output_tokens)
                .map(|(i, o)| i.saturating_add(o))
        })
    }
}

/// Usage from an `agui.done` data payload; `None` when it carries none
/// (UAR's plain `RunDone`).
pub fn parse_done_usage(data: &str) -> Option<Usage> {
    let value: Value = serde_json::from_str(data).ok()?;
    let usage = value.get("usage")?.as_object()?;
    let number = |key: &str| usage.get(key).and_then(Value::as_u64);
    Some(Usage {
        input_tokens: number("input_tokens"),
        output_tokens: number("output_tokens"),
        total_tokens: number("total_tokens"),
        model: usage
            .get("model")
            .and_then(Value::as_str)
            .map(str::to_owned),
    })
}

/// One FR-38 record and its counter adjustment. No session id, no text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TurnRecord {
    pub periods: Periods,
    pub reserved: u64,
    /// Tokens finally charged: actual usage, or the reservation if unknown.
    pub charged: u64,
    pub usage: Usage,
    pub ttft_ms: Option<u64>,
    pub outcome: Outcome,
}

impl TurnRecord {
    pub fn excess(&self) -> u64 {
        self.charged.saturating_sub(self.reserved)
    }

    /// `charged - reserved`, the counter adjustment at settlement.
    pub fn delta(&self) -> i128 {
        i128::from(self.charged) - i128::from(self.reserved)
    }
}

/// Settles both recorded rows by `charged - reserved` and writes the FR-38
/// record, in one transaction. `$model` and `$outcome` are bound by the
/// store client.
pub fn settle_query(record: &TurnRecord) -> String {
    let (day, month) = (&record.periods.day, &record.periods.month);
    let delta = record.delta();
    let opt = |v: Option<u64>| v.map_or_else(|| "NONE".to_owned(), |n| n.to_string());
    format!(
        "BEGIN TRANSACTION;\n\
         LET $d = UPDATE meter:{day} SET total += {delta} RETURN AFTER;\n\
         LET $m = UPDATE meter:{month} SET total += {delta} RETURN AFTER;\n\
         CREATE turn CONTENT {{ at: time::now(), day: '{day}', month: '{month}', \
         model: $model, outcome: $outcome, input_tokens: {input}, output_tokens: {output}, \
         total_tokens: {total}, ttft_ms: {ttft}, reserved: {reserved}, charged: {charged}, \
         excess: {excess} }};\n\
         RETURN {{ day: $d[0].total, month: $m[0].total }};\n\
         COMMIT TRANSACTION;",
        input = opt(record.usage.input_tokens),
        output = opt(record.usage.output_tokens),
        total = opt(record.usage.total_tokens),
        ttft = opt(record.ttft_ms),
        reserved = record.reserved,
        charged = record.charged,
        excess = record.excess(),
    )
}

/// What a reservation attempt came to, read from the store's answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReserveResult {
    Reserved(Totals),
    Exhausted(PeriodKind),
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum MeterResponseError {
    #[error("meter response is not the expected JSON")]
    Malformed,
    #[error("meter statement failed")]
    StatementFailed,
}

/// Reads a `/sql` answer: a statement array, or `{ "result": [...] }`.
pub fn parse_reserve_response(body: &[u8]) -> Result<ReserveResult, MeterResponseError> {
    let statements = statements(body)?;
    for statement in &statements {
        if statement.get("status").and_then(Value::as_str) != Some("ERR") {
            continue;
        }
        let message = statement
            .get("result")
            .map(Value::to_string)
            .unwrap_or_default();
        if message.contains(&format!("{BUDGET_EXCEEDED_MARKER}:day")) {
            return Ok(ReserveResult::Exhausted(PeriodKind::Day));
        }
        if message.contains(&format!("{BUDGET_EXCEEDED_MARKER}:month")) {
            return Ok(ReserveResult::Exhausted(PeriodKind::Month));
        }
    }
    totals(&statements).map(ReserveResult::Reserved)
}

/// Reads a settlement answer: the new totals, or an error if any statement
/// failed.
pub fn parse_settle_response(body: &[u8]) -> Result<Totals, MeterResponseError> {
    totals(&statements(body)?)
}

fn statements(body: &[u8]) -> Result<Vec<Value>, MeterResponseError> {
    let value: Value = serde_json::from_slice(body).map_err(|_| MeterResponseError::Malformed)?;
    let list = match value {
        Value::Array(list) => list,
        Value::Object(mut map) => match map.remove("result") {
            Some(Value::Array(list)) => list,
            _ => return Err(MeterResponseError::Malformed),
        },
        _ => return Err(MeterResponseError::Malformed),
    };
    Ok(list)
}

fn totals(statements: &[Value]) -> Result<Totals, MeterResponseError> {
    if statements
        .iter()
        .any(|s| s.get("status").and_then(Value::as_str) != Some("OK"))
    {
        return Err(MeterResponseError::StatementFailed);
    }
    statements
        .iter()
        .rev()
        .filter_map(|s| s.get("result"))
        .find_map(|r| {
            Some(Totals {
                day: r.get("day")?.as_u64()?,
                month: r.get("month")?.as_u64()?,
            })
        })
        .ok_or(MeterResponseError::Malformed)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Crossing {
    /// Passed 80% of the budget.
    Warning,
    /// Reached the budget.
    Exhausted,
}

/// The thresholds a counter crossed going from `before` to `after`.
pub fn crossings(before: u64, after: u64, budget: u64) -> Vec<Crossing> {
    let warn_at = budget.saturating_mul(WARN_NUMERATOR) / WARN_DENOMINATOR;
    let mut out = Vec::new();
    if before < warn_at && after >= warn_at {
        out.push(Crossing::Warning);
    }
    if before < budget && after >= budget {
        out.push(Crossing::Exhausted);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const BUDGETS: Budgets = Budgets {
        daily: 1_000_000,
        monthly: 20_000_000,
    };

    #[test]
    fn periods_should_be_utc_day_and_month_keys() {
        // 2026-10-02T23:59:59Z and one second later.
        assert_eq!(
            Periods::at(1_790_985_599),
            Periods {
                day: "day_2026_10_02".into(),
                month: "month_2026_10".into()
            }
        );
        assert_eq!(Periods::at(1_790_985_600).day, "day_2026_10_03");
        // 2026-10-31T23:59:59Z -> 2026-11-01: a new month row.
        assert_eq!(Periods::at(1_793_491_199).month, "month_2026_10");
        let next = Periods::at(1_793_491_200);
        assert_eq!(
            (next.day.as_str(), next.month.as_str()),
            ("day_2026_11_01", "month_2026_11")
        );
        // Leap day.
        assert_eq!(Periods::at(1_709_164_800).day, "day_2024_02_29");
        assert_eq!(Periods::at(0).day, "day_1970_01_01");
    }

    #[test]
    fn reserve_query_should_guard_both_rows_and_throw_on_an_empty_update() {
        let q = reserve_query(&Periods::at(1_790_985_599), 9_000, BUDGETS);
        assert!(q.starts_with("BEGIN TRANSACTION;") && q.ends_with("COMMIT TRANSACTION;"));
        assert!(q.contains("UPSERT meter:day_2026_10_02 SET total += 0"));
        assert!(q.contains("UPSERT meter:month_2026_10 SET total += 0"));
        assert!(q.contains("WHERE total + 9000 <= 1000000"));
        assert!(q.contains("WHERE total + 9000 <= 20000000"));
        assert!(q.contains("THROW 'meter_budget_exceeded:day'"));
        assert!(q.contains("THROW 'meter_budget_exceeded:month'"));
    }

    fn record(reserved: u64, charged: u64) -> TurnRecord {
        TurnRecord {
            periods: Periods::at(1_790_985_599),
            reserved,
            charged,
            usage: Usage::default(),
            ttft_ms: Some(840),
            outcome: Outcome::Completed,
        }
    }

    #[test]
    fn settlement_should_charge_actual_usage_including_excess() {
        let under = record(9_000, 1_450);
        assert_eq!((under.delta(), under.excess()), (-7_550, 0));
        let over = record(9_000, 12_000);
        assert_eq!((over.delta(), over.excess()), (3_000, 3_000));
        let q = settle_query(&over);
        assert!(q.contains("UPDATE meter:day_2026_10_02 SET total += 3000"));
        assert!(q.contains("UPDATE meter:month_2026_10 SET total += 3000"));
        assert!(q.contains("excess: 3000") && q.contains("model: $model"));
        assert!(q.contains("input_tokens: NONE") && q.contains("ttft_ms: 840"));
        assert!(settle_query(&under).contains("SET total += -7550"));
    }

    #[test]
    fn settlement_should_use_the_recorded_periods_not_the_current_ones() {
        let mut r = record(10, 20);
        r.periods = Periods::at(0);
        let q = settle_query(&r);
        assert!(q.contains("meter:day_1970_01_01") && q.contains("meter:month_1970_01"));
    }

    #[test]
    fn done_usage_should_be_parsed_and_missing_usage_should_keep_the_reservation() {
        let usage = parse_done_usage(
            r#"{"kind":"done","usage":{"input_tokens":1430,"output_tokens":210,"total_tokens":1640,"model":"qwen3.8-max"}}"#,
        )
        .unwrap();
        assert_eq!(usage.charged_tokens(), Some(1640));
        assert_eq!(usage.model.as_deref(), Some("qwen3.8-max"));

        let no_total =
            parse_done_usage(r#"{"usage":{"input_tokens":5,"output_tokens":6}}"#).unwrap();
        assert_eq!(no_total.charged_tokens(), Some(11));
        let partial = parse_done_usage(r#"{"usage":{"input_tokens":5}}"#).unwrap();
        assert_eq!(partial.charged_tokens(), None);
        assert_eq!(
            parse_done_usage(r#"{"kind":"done","request_id":"r"}"#),
            None
        );
        assert_eq!(parse_done_usage("not json"), None);
    }

    #[test]
    fn reserve_response_should_distinguish_reserved_exhausted_and_errors() {
        let ok = br#"[{"status":"OK","result":null},{"status":"OK","result":{"day":9000,"month":9000}}]"#;
        assert_eq!(
            parse_reserve_response(ok),
            Ok(ReserveResult::Reserved(Totals {
                day: 9000,
                month: 9000
            }))
        );
        let wrapped = br#"{"result":[{"status":"OK","result":{"day":1,"month":2}}]}"#;
        assert!(matches!(
            parse_reserve_response(wrapped),
            Ok(ReserveResult::Reserved(_))
        ));

        let day = br#"[{"status":"ERR","result":"The query was not executed due to a failed transaction"},{"status":"ERR","result":"An error occurred: meter_budget_exceeded:day"}]"#;
        assert_eq!(
            parse_reserve_response(day),
            Ok(ReserveResult::Exhausted(PeriodKind::Day))
        );
        let month =
            br#"[{"status":"ERR","result":"An error occurred: meter_budget_exceeded:month"}]"#;
        assert_eq!(
            parse_reserve_response(month),
            Ok(ReserveResult::Exhausted(PeriodKind::Month))
        );

        let other = br#"[{"status":"ERR","result":"IAM error: Not enough permissions"}]"#;
        assert_eq!(
            parse_reserve_response(other),
            Err(MeterResponseError::StatementFailed)
        );
        assert_eq!(
            parse_reserve_response(b"<html>"),
            Err(MeterResponseError::Malformed)
        );
        assert_eq!(
            parse_reserve_response(br#"[{"status":"OK","result":null}]"#),
            Err(MeterResponseError::Malformed)
        );
    }

    #[test]
    fn crossings_should_fire_once_when_a_threshold_is_passed() {
        assert_eq!(
            crossings(790_000, 800_000, 1_000_000),
            vec![Crossing::Warning]
        );
        assert!(crossings(800_000, 810_000, 1_000_000).is_empty());
        assert_eq!(
            crossings(700_000, 1_000_000, 1_000_000),
            vec![Crossing::Warning, Crossing::Exhausted]
        );
        assert_eq!(
            crossings(990_000, 1_003_000, 1_000_000),
            vec![Crossing::Exhausted]
        );
        assert!(crossings(1_003_000, 1_004_000, 1_000_000).is_empty());
    }
}
