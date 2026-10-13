// TJ-ARCH-MOB-001 compliant
//! Daily search cap (OD-8): at most `limit` upstream searches per UTC day.
//!
//! A search is counted when it is admitted, before the upstream call, so a
//! call that later times out or fails still counts (it may still have cost
//! credits). The count resets when the UTC day changes, that is at
//! 00:00:00 UTC.

use std::time::{SystemTime, UNIX_EPOCH};

/// OD-8 default: 300 searches per UTC day.
pub const DEFAULT_DAILY_CAP: u32 = 300;

const SECONDS_PER_DAY: u64 = 86_400;

/// Days since the Unix epoch in UTC. A clock before the epoch maps to day 0.
pub fn utc_day(now: SystemTime) -> u64 {
    now.duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_secs() / SECONDS_PER_DAY)
        .unwrap_or(0)
}

/// The counter for one UTC day.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CapState {
    pub day: u64,
    pub used: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Admission {
    /// The search may run; `used` counts it.
    Admitted { used: u32 },
    /// The cap is reached for today; the upstream must not be called.
    Exhausted,
}

impl CapState {
    pub const fn new(day: u64) -> Self {
        Self { day, used: 0 }
    }

    /// Returns the next state and whether one more search is admitted on
    /// `today` under `limit`. A state from an earlier (or later) day starts
    /// over at zero.
    pub fn admit(self, today: u64, limit: u32) -> (Self, Admission) {
        let current = if self.day == today {
            self
        } else {
            Self::new(today)
        };
        if current.used >= limit {
            return (current, Admission::Exhausted);
        }
        let used = current.used + 1;
        (Self { day: today, used }, Admission::Admitted { used })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    fn at(seconds: u64) -> SystemTime {
        UNIX_EPOCH + Duration::from_secs(seconds)
    }

    #[test]
    fn utc_day_should_change_exactly_at_midnight_utc() {
        let day = 20_000;
        let last_second = day * SECONDS_PER_DAY + SECONDS_PER_DAY - 1;
        assert_eq!(
            (utc_day(at(last_second)), utc_day(at(last_second + 1))),
            (day, day + 1)
        );
    }

    #[test]
    fn admit_should_count_each_admitted_search() {
        let (state, admission) = CapState::new(7).admit(7, 3);
        assert_eq!(
            (state, admission),
            (
                CapState { day: 7, used: 1 },
                Admission::Admitted { used: 1 }
            )
        );
    }

    #[test]
    fn admit_should_refuse_once_the_cap_is_reached() {
        let state = CapState { day: 7, used: 2 };
        let (next, admission) = state.admit(7, 2);
        assert_eq!((next, admission), (state, Admission::Exhausted));
    }

    #[test]
    fn admit_should_allow_the_last_search_under_the_cap() {
        let (_, admission) = CapState { day: 7, used: 1 }.admit(7, 2);
        assert_eq!(admission, Admission::Admitted { used: 2 });
    }

    #[test]
    fn admit_should_reset_on_a_new_utc_day() {
        let exhausted = CapState { day: 7, used: 2 };
        let (next, admission) = exhausted.admit(8, 2);
        assert_eq!(
            (next, admission),
            (
                CapState { day: 8, used: 1 },
                Admission::Admitted { used: 1 }
            )
        );
    }

    #[test]
    fn admit_should_refuse_everything_with_a_zero_cap() {
        let (_, admission) = CapState::new(7).admit(7, 0);
        assert_eq!(admission, Admission::Exhausted);
    }
}
