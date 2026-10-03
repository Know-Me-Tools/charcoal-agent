// TJ-ARCH-MOB-001 compliant
//! Validation of ids interpolated into upstream paths.
//!
//! Session and run ids are UUIDs in practice; the charset is deliberately a
//! little wider so an id-format change in UAR does not break the site.
//! Restricting the charset keeps `.`/`..`,
//! `/` and percent-encoded separators out of the upstream URL, where URL
//! normalization would otherwise let `{id} = ".."` reach a different route.

const MAX_ID_LEN: usize = 128;

pub fn is_valid_path_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= MAX_ID_LEN
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uuid_should_be_valid() {
        assert!(is_valid_path_id("0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7c"));
    }

    #[test]
    fn traversal_and_separators_should_be_rejected() {
        for bad in ["", ".", "..", "a/b", "a%2Fb", "a b", &"x".repeat(129)] {
            assert!(!is_valid_path_id(bad), "{bad:?} accepted");
        }
    }
}
