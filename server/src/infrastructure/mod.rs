// TJ-ARCH-MOB-001 compliant
//! Adapters to the outside world: the UAR HTTP upstream, the asset store,
//! the in-memory rate limiter, the meter store and the kill switch file.

pub mod assets;
pub mod kill_switch;
pub mod meter_store;
pub mod rate_limit;
pub mod upstream;
