// TJ-ARCH-MOB-001 compliant
//! Binds every upstream UAR session to the visitor (FR-34, §6.2 T5).
//!
//! All visitors share one UAR principal, and UAR keys conversation state on
//! `X-UAR-Session-ID`. A visitor who knew another visitor's thread id could
//! otherwise continue that conversation. The site server therefore never
//! forwards the client's thread id. It sends
//! `HMAC-SHA256(secret, visitor_id ‖ thread_id)`, formatted as a UUID, where
//! `visitor_id` comes from a signed first-party cookie the browser cannot
//! read. The derivation is stateless, so every replica with the same secret
//! derives the same upstream session.
//!
//! One secret serves two purposes, kept apart by input shape:
//! - cookie signature: HMAC(secret, `COOKIE_LABEL` ‖ visitor_hex), and
//! - upstream session: HMAC(secret, visitor_hex ‖ thread_id).
//!
//! The cookie input starts with a non-hex label, the session input with 32
//! hex digits, so a cookie signature is never a valid session derivation.

use std::fmt;
use std::fmt::Write as _;

use hmac::{Hmac, KeyInit, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// Shortest accepted secret, in bytes (the HMAC-SHA256 output size).
pub const MIN_SECRET_BYTES: usize = 32;
/// Random bytes in a visitor id.
pub const VISITOR_ID_BYTES: usize = 16;
const VISITOR_HEX_LEN: usize = VISITOR_ID_BYTES * 2;
const SIGNATURE_HEX_LEN: usize = 64;
const COOKIE_LABEL: &[u8] = b"knowme-site/visitor-cookie/v1:";
const UUID_LEN: usize = 36;
const UUID_HYPHENS: [usize; 4] = [8, 13, 18, 23];

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
#[error("the session secret must be at least {MIN_SECRET_BYTES} bytes")]
pub struct WeakSecretError;

/// The HMAC key. Its `Debug` output never shows the key.
#[derive(Clone)]
pub struct SessionSecret {
    mac: HmacSha256,
}

impl SessionSecret {
    pub fn new(key: &[u8]) -> Result<Self, WeakSecretError> {
        if key.len() < MIN_SECRET_BYTES {
            return Err(WeakSecretError);
        }
        // HMAC accepts keys of any length; the error arm is unreachable.
        let mac = HmacSha256::new_from_slice(key).map_err(|_| WeakSecretError)?;
        Ok(Self { mac })
    }

    /// The cookie value for `visitor`: `<visitor hex>.<signature hex>`.
    pub fn visitor_token(&self, visitor: &VisitorId) -> String {
        let hex = visitor.to_hex();
        let mut mac = self.mac.clone();
        mac.update(COOKIE_LABEL);
        mac.update(hex.as_bytes());
        format!("{hex}.{}", encode_hex(&mac.finalize().into_bytes()))
    }

    /// The visitor a cookie value names, if its signature verifies. The
    /// comparison is constant-time.
    pub fn verify_visitor_token(&self, token: &str) -> Option<VisitorId> {
        let (hex, signature) = token.split_once('.')?;
        let visitor = VisitorId::from_hex(hex)?;
        if signature.len() != SIGNATURE_HEX_LEN {
            return None;
        }
        let signature = decode_hex(signature)?;
        let mut mac = self.mac.clone();
        mac.update(COOKIE_LABEL);
        mac.update(hex.as_bytes());
        mac.verify_slice(&signature).ok().map(|()| visitor)
    }

    /// `HMAC-SHA256(secret, visitor_hex ‖ thread_id)`, first 16 bytes, with
    /// the UUID version (4) and variant (RFC 4122) bits set so UAR's UUID
    /// parser accepts it. 122 bits of the MAC remain.
    pub fn upstream_session_id(&self, visitor: &VisitorId, thread: &ThreadId) -> String {
        let mut mac = self.mac.clone();
        mac.update(visitor.to_hex().as_bytes());
        mac.update(thread.as_str().as_bytes());
        let digest = mac.finalize().into_bytes();
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&digest[..16]);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        format_uuid(&bytes)
    }
}

impl fmt::Debug for SessionSecret {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SessionSecret(<redacted>)")
    }
}

/// A random visitor id, carried in the signed cookie.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct VisitorId([u8; VISITOR_ID_BYTES]);

impl VisitorId {
    pub fn from_bytes(bytes: [u8; VISITOR_ID_BYTES]) -> Self {
        Self(bytes)
    }

    fn to_hex(self) -> String {
        encode_hex(&self.0)
    }

    /// Exactly 32 lowercase hex digits, as `to_hex` writes them.
    fn from_hex(hex: &str) -> Option<Self> {
        if hex.len() != VISITOR_HEX_LEN || hex.bytes().any(|b| b.is_ascii_uppercase()) {
            return None;
        }
        let bytes = decode_hex(hex)?;
        bytes.try_into().ok().map(Self)
    }
}

impl fmt::Debug for VisitorId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("VisitorId(<redacted>)")
    }
}

/// A client thread id: a UUIDv4, normalised to lowercase.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ThreadId(String);

impl ThreadId {
    /// Accepts the canonical 8-4-4-4-12 form with version 4 and the RFC 4122
    /// variant, in either case. Anything else is rejected.
    pub fn parse(raw: &str) -> Option<Self> {
        is_uuid_v4(raw).then(|| Self(raw.to_ascii_lowercase()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

fn is_uuid_v4(raw: &str) -> bool {
    let bytes = raw.as_bytes();
    if bytes.len() != UUID_LEN {
        return false;
    }
    let shape_ok = bytes.iter().enumerate().all(|(i, b)| {
        if UUID_HYPHENS.contains(&i) {
            *b == b'-'
        } else {
            b.is_ascii_hexdigit()
        }
    });
    shape_ok && bytes[14] == b'4' && matches!(bytes[19], b'8' | b'9' | b'a' | b'b' | b'A' | b'B')
}

fn format_uuid(bytes: &[u8; 16]) -> String {
    let hex = encode_hex(bytes);
    format!(
        "{}-{}-{}-{}-{}",
        &hex[0..8],
        &hex[8..12],
        &hex[12..16],
        &hex[16..20],
        &hex[20..32]
    )
}

fn encode_hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        // Writing to a String cannot fail.
        let _ = write!(out, "{b:02x}");
    }
    out
}

fn decode_hex(hex: &str) -> Option<Vec<u8>> {
    if hex.len() % 2 != 0 {
        return None;
    }
    hex.as_bytes()
        .chunks(2)
        .map(|pair| {
            let digits = std::str::from_utf8(pair).ok()?;
            u8::from_str_radix(digits, 16).ok()
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const THREAD_A: &str = "0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7c";
    const THREAD_B: &str = "6f1d2e3c-4b5a-4c6d-8e7f-9a0b1c2d3e4f";

    fn secret(byte: u8) -> SessionSecret {
        SessionSecret::new(&[byte; MIN_SECRET_BYTES]).unwrap()
    }

    fn thread(raw: &str) -> ThreadId {
        ThreadId::parse(raw).unwrap()
    }

    const VISITOR_1: VisitorId = VisitorId([1; VISITOR_ID_BYTES]);
    const VISITOR_2: VisitorId = VisitorId([2; VISITOR_ID_BYTES]);

    #[test]
    fn derivation_should_be_deterministic_for_the_same_cookie_and_thread() {
        let s = secret(7);
        assert_eq!(
            s.upstream_session_id(&VISITOR_1, &thread(THREAD_A)),
            s.upstream_session_id(&VISITOR_1, &thread(THREAD_A))
        );
        // Another replica holding the same secret derives the same id.
        assert_eq!(
            s.upstream_session_id(&VISITOR_1, &thread(THREAD_A)),
            secret(7).upstream_session_id(&VISITOR_1, &thread(THREAD_A))
        );
    }

    #[test]
    fn derivation_should_differ_across_cookies_threads_and_secrets() {
        let s = secret(7);
        let base = s.upstream_session_id(&VISITOR_1, &thread(THREAD_A));
        assert_ne!(base, s.upstream_session_id(&VISITOR_2, &thread(THREAD_A)));
        assert_ne!(base, s.upstream_session_id(&VISITOR_1, &thread(THREAD_B)));
        assert_ne!(
            base,
            secret(8).upstream_session_id(&VISITOR_1, &thread(THREAD_A))
        );
        // The visitor never gets their own thread id back as the session.
        assert_ne!(base, THREAD_A);
    }

    #[test]
    fn derived_id_should_be_a_uuid_v4() {
        let id = secret(7).upstream_session_id(&VISITOR_1, &thread(THREAD_A));
        assert!(is_uuid_v4(&id), "{id}");
        assert_eq!(id, id.to_ascii_lowercase());
    }

    #[test]
    fn thread_id_case_should_not_change_the_derivation() {
        let s = secret(7);
        assert_eq!(
            s.upstream_session_id(&VISITOR_1, &thread(THREAD_A)),
            s.upstream_session_id(&VISITOR_1, &thread(&THREAD_A.to_ascii_uppercase()))
        );
    }

    #[test]
    fn non_v4_thread_ids_should_be_rejected() {
        for bad in [
            "",
            "a",
            "0b7e3c1a5f0e4a8e9c3b2d1f4e5a6b7c",
            // version 1
            "0b7e3c1a-5f0e-1a8e-9c3b-2d1f4e5a6b7c",
            // variant 0xxx
            "0b7e3c1a-5f0e-4a8e-1c3b-2d1f4e5a6b7c",
            "{0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7c}",
            "0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7z",
            " 0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7",
        ] {
            assert!(ThreadId::parse(bad).is_none(), "{bad:?} accepted");
        }
        assert!(ThreadId::parse(THREAD_A).is_some());
    }

    #[test]
    fn visitor_token_should_round_trip() {
        let s = secret(7);
        let token = s.visitor_token(&VISITOR_1);
        assert_eq!(s.verify_visitor_token(&token), Some(VISITOR_1));
    }

    #[test]
    fn tampered_or_foreign_tokens_should_be_rejected() {
        let s = secret(7);
        let token = s.visitor_token(&VISITOR_1);
        let (hex, sig) = token.split_once('.').unwrap();

        // Another visitor id under the first visitor's signature.
        let swapped = format!("{}.{sig}", VISITOR_2.to_hex());
        // One flipped signature digit.
        let mut flipped = sig.to_owned();
        let last = if flipped.ends_with('0') { "1" } else { "0" };
        flipped.replace_range(sig.len() - 1.., last);
        let flipped = format!("{hex}.{flipped}");

        for bad in [
            swapped.as_str(),
            flipped.as_str(),
            &token.to_ascii_uppercase(),
            &secret(8).visitor_token(&VISITOR_1),
            hex,
            "",
            ".",
            &format!("{hex}."),
            &format!("{hex}.{}", &sig[..10]),
        ] {
            assert_eq!(s.verify_visitor_token(bad), None, "{bad:?} accepted");
        }
    }

    #[test]
    fn short_secret_should_be_refused_and_debug_should_not_show_it() {
        assert_eq!(
            SessionSecret::new(&[1; MIN_SECRET_BYTES - 1]).unwrap_err(),
            WeakSecretError
        );
        let shown = format!("{:?} {:?}", secret(0x61), VISITOR_1);
        assert!(
            !shown.contains("aaaa") && !shown.contains("0101"),
            "{shown}"
        );
    }
}
