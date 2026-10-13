// TJ-ARCH-MOB-001 compliant
//! The one tool input: a search query of 1 to 200 characters.
//!
//! The query is visitor-derived text written by the model, so it is never
//! logged and its `Debug` is redacted.

use std::fmt;

/// Longest accepted query, in Unicode scalar values (design.md section 3).
pub const MAX_QUERY_CHARS: usize = 200;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum QueryError {
    #[error("the query is empty")]
    Empty,
    #[error("the query is longer than 200 characters")]
    TooLong,
}

/// A validated, trimmed search query.
#[derive(Clone, PartialEq, Eq)]
pub struct SearchQuery(String);

impl SearchQuery {
    /// Trims surrounding whitespace, then requires 1 to 200 characters.
    pub fn parse(raw: &str) -> Result<Self, QueryError> {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            return Err(QueryError::Empty);
        }
        if trimmed.chars().count() > MAX_QUERY_CHARS {
            return Err(QueryError::TooLong);
        }
        Ok(Self(trimmed.to_owned()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Debug for SearchQuery {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SearchQuery([REDACTED])")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_should_reject_an_empty_query() {
        assert_eq!(SearchQuery::parse(""), Err(QueryError::Empty));
    }

    #[test]
    fn parse_should_reject_a_whitespace_only_query() {
        assert_eq!(SearchQuery::parse(" \t\n "), Err(QueryError::Empty));
    }

    #[test]
    fn parse_should_accept_exactly_200_characters() {
        let raw = "é".repeat(MAX_QUERY_CHARS);
        assert_eq!(SearchQuery::parse(&raw).map(|q| q.0), Ok(raw));
    }

    #[test]
    fn parse_should_reject_201_characters() {
        let raw = "a".repeat(MAX_QUERY_CHARS + 1);
        assert_eq!(SearchQuery::parse(&raw), Err(QueryError::TooLong));
    }

    #[test]
    fn parse_should_trim_surrounding_whitespace() {
        let query = SearchQuery::parse("  rust release  ").map(|q| q.0);
        assert_eq!(query, Ok("rust release".to_owned()));
    }

    #[test]
    fn debug_should_not_print_the_query() {
        let query = SearchQuery::parse("private words").map(|q| format!("{q:?}"));
        assert_eq!(query, Ok("SearchQuery([REDACTED])".to_owned()));
    }
}
