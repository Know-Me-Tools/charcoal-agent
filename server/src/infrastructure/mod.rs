// TJ-ARCH-MOB-001 compliant
//! Adapters to the outside world: the UAR HTTP upstream, the gate token
//! source, the asset store,
//! the in-memory rate limiter, the meter store, the kill switch file and the
//! A2UI opt-in file.

pub mod a2ui_optin;
pub mod assets;
pub mod gate_token;
pub mod kill_switch;
pub mod meter_store;
pub mod rate_limit;
pub mod upstream;
