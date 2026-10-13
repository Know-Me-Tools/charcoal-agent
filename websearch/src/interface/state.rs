// TJ-ARCH-MOB-001 compliant
//! Router state.

use crate::application::search::SearchService;

#[derive(Clone)]
pub struct AppState {
    pub search: SearchService,
}
