// TJ-ARCH-MOB-001 compliant
//! Wraps an upstream SSE body with the internal-artifact filter (FR-45).
//!
//! Each upstream chunk is filtered as it arrives and the complete events it
//! carries are released at once, so the stream stays unbuffered. The
//! optional tap sees every upstream chunk before the filter; it exists for
//! the FR-11 harness only and can be set only through the `test-harness`
//! build (`crate::build_app_with_upstream_tap`), never by a request.

use axum::body::Bytes;
use futures_util::{Stream, StreamExt};

use crate::domain::agui_filter::{Filtered, InternalArtifactFilter};

/// Receives every upstream SSE chunk of a chat turn before the filter.
pub type UpstreamTap = tokio::sync::mpsc::UnboundedSender<Bytes>;

struct State<S> {
    upstream: S,
    filter: InternalArtifactFilter,
    tap: Option<UpstreamTap>,
    done: bool,
}

pub fn filter_internal_artifacts<S, E>(
    upstream: S,
    tap: Option<UpstreamTap>,
) -> impl Stream<Item = Result<Bytes, E>> + Send + 'static
where
    S: Stream<Item = Result<Bytes, E>> + Send + Unpin + 'static,
    E: Send + 'static,
{
    let state = State {
        upstream,
        filter: InternalArtifactFilter::new(),
        tap,
        done: false,
    };
    futures_util::stream::unfold(state, |mut state| async move {
        while !state.done {
            match state.upstream.next().await {
                Some(Ok(chunk)) => {
                    if let Some(tap) = &state.tap {
                        // A closed harness receiver must not end the visitor's stream.
                        let _ = tap.send(chunk.clone());
                    }
                    let out = report(state.filter.push(&chunk));
                    if !out.is_empty() {
                        return Some((Ok(out), state));
                    }
                }
                Some(Err(err)) => {
                    state.done = true;
                    return Some((Err(err), state));
                }
                None => {
                    state.done = true;
                    let out = report(state.filter.finish());
                    if !out.is_empty() {
                        return Some((Ok(out), state));
                    }
                }
            }
        }
        None
    })
}

/// Logs what was dropped (counts only, never content) and returns the bytes
/// to forward.
fn report(filtered: Filtered) -> Bytes {
    if filtered.dropped_internal > 0 {
        tracing::debug!(
            count = filtered.dropped_internal,
            "dropped internal run artifacts from the public stream"
        );
    }
    if filtered.dropped_malformed > 0 {
        tracing::warn!(
            count = filtered.dropped_malformed,
            "dropped agui.artifact events whose artifact_type could not be read"
        );
    }
    Bytes::from(filtered.forward)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::convert::Infallible;

    const POLICY: &[u8] =
        b"event: agui.artifact\ndata: {\"artifact_type\":\"effective_run_policy\"}\n\n";
    const DELTA: &[u8] = b"event: agui.message.delta\ndata: {\"delta\":{\"text\":\"hi\"}}\n\n";

    fn chunks(parts: &[&'static [u8]]) -> Vec<Result<Bytes, Infallible>> {
        parts.iter().map(|p| Ok(Bytes::from_static(p))).collect()
    }

    #[tokio::test]
    async fn should_forward_filtered_events_and_tap_the_raw_stream() {
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
        let upstream = futures_util::stream::iter(chunks(&[POLICY, &DELTA[..10], &DELTA[10..]]));

        let out: Vec<Bytes> = filter_internal_artifacts(upstream, Some(tx))
            .map(|r| r.unwrap())
            .collect()
            .await;

        assert_eq!(out.concat(), DELTA);
        let mut tapped = Vec::new();
        while let Ok(chunk) = rx.try_recv() {
            tapped.extend_from_slice(&chunk);
        }
        assert_eq!(tapped, [POLICY, DELTA].concat());
    }
}
