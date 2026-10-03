// TJ-ARCH-MOB-001 compliant
//! Adapters to the outside world: the UAR HTTP upstream, the asset store and
//! the in-memory rate limiter.

pub mod assets;
pub mod rate_limit;
pub mod upstream;
