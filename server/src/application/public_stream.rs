// TJ-ARCH-MOB-001 compliant
//! Wraps an upstream SSE body with the internal-artifact filter (FR-45).
//!
//! Each upstream chunk is filtered as it arrives and the complete events it
//! carries are released at once, so the stream stays unbuffered. The
//! optional tap sees every upstream chunk before the filter; it exists for
//! the FR-11 harness only and can be set only through the `test-harness`
//! build (`crate::build_app_with_upstream_tap`), never by a request.
//!
//! The turn tracker sees every run signal (from the unfiltered events) and
//! settles the meter when the stream ends; if the visitor disconnects first,
//! dropping the stream drops the tracker, which settles it then.

use std::time::Duration;

use axum::body::Bytes;
use futures_util::{Stream, StreamExt};

use crate::application::meter::TurnTracker;
use crate::domain::agui_filter::{Filtered, InternalArtifactFilter};
use crate::domain::meter::Outcome;

/// Receives every upstream SSE chunk of a chat turn before the filter.
pub type UpstreamTap = tokio::sync::mpsc::UnboundedSender<Bytes>;

struct State<S> {
    upstream: S,
    filter: InternalArtifactFilter,
    tap: Option<UpstreamTap>,
    tracker: Option<TurnTracker>,
    done: bool,
}

impl<S> State<S> {
    /// Feeds the run signals to the tracker and returns the bytes to send.
    fn release(&mut self, filtered: Filtered) -> Bytes {
        if let Some(tracker) = &mut self.tracker {
            for signal in &filtered.signals {
                tracker.observe(signal);
            }
        }
        report(filtered)
    }

    fn end(&mut self) {
        self.done = true;
        if let Some(tracker) = &mut self.tracker {
            tracker.finish(Outcome::Incomplete);
        }
    }
}

pub fn filter_internal_artifacts<S, E>(
    upstream: S,
    tap: Option<UpstreamTap>,
    tracker: Option<TurnTracker>,
) -> impl Stream<Item = Result<Bytes, E>> + Send + 'static
where
    S: Stream<Item = Result<Bytes, E>> + Send + Unpin + 'static,
    E: Send + 'static,
{
    let state = State {
        upstream,
        filter: InternalArtifactFilter::new(),
        tap,
        tracker,
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
                    let filtered = state.filter.push(&chunk);
                    let out = state.release(filtered);
                    if !out.is_empty() {
                        return Some((Ok(out), state));
                    }
                }
                Some(Err(err)) => {
                    state.end();
                    return Some((Err(err), state));
                }
                None => {
                    let filtered = state.filter.finish();
                    let out = state.release(filtered);
                    state.end();
                    if !out.is_empty() {
                        return Some((Ok(out), state));
                    }
                }
            }
        }
        None
    })
}

/// Silence on the visitor's stream after which a keep-alive comment is sent.
/// UAR sends none on a normal run, and a reply can be quiet for 30 s or more
/// while retrieval and the model's first call finish, so a phone sees no bytes
/// and cannot tell a quiet stream from a dead connection.
pub const KEEP_ALIVE_AFTER: Duration = Duration::from_secs(10);

/// An SSE comment: no event, no data. The page's parser ignores it.
const KEEP_ALIVE_FRAME: &[u8] = b": keep-alive\n\n";

/// Passes `inner` through unchanged and adds a keep-alive comment each time it
/// has been silent for `after`. Ends when `inner` ends, so a finished reply is
/// never held open.
pub fn with_keep_alive<S, E>(
    inner: S,
    after: Duration,
) -> impl Stream<Item = Result<Bytes, E>> + Send + 'static
where
    S: Stream<Item = Result<Bytes, E>> + Send + 'static,
    E: Send + 'static,
{
    futures_util::stream::unfold(Box::pin(inner), move |mut inner| async move {
        tokio::select! {
            item = inner.next() => item.map(|item| (item, inner)),
            () = tokio::time::sleep(after) => Some((Ok(Bytes::from_static(KEEP_ALIVE_FRAME)), inner)),
        }
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

        let out: Vec<Bytes> = filter_internal_artifacts(upstream, Some(tx), None)
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

    #[tokio::test]
    async fn should_send_keep_alives_while_upstream_is_silent_and_then_pass_the_data_through() {
        let slow = futures_util::stream::unfold(false, |sent| async move {
            if sent {
                return None;
            }
            tokio::time::sleep(Duration::from_millis(230)).await;
            Some((Ok::<_, Infallible>(Bytes::from_static(DELTA)), true))
        });

        let out: Vec<Bytes> = with_keep_alive(slow, Duration::from_millis(50))
            .map(|r| r.unwrap())
            .collect()
            .await;

        let (data, beats) = out.split_last().expect("at least the data frame");
        assert_eq!(
            data.as_ref(),
            DELTA,
            "the data frame arrives last and unchanged"
        );
        assert!(
            beats.len() >= 2,
            "expected keep-alives during the silence, got {}",
            beats.len()
        );
        assert!(beats.iter().all(|b| b.as_ref() == KEEP_ALIVE_FRAME));
    }

    #[tokio::test]
    async fn should_add_nothing_to_a_stream_that_is_never_silent() {
        let fast = futures_util::stream::iter(chunks(&[DELTA, DELTA]));

        let out: Vec<Bytes> = with_keep_alive(fast, Duration::from_secs(5))
            .map(|r| r.unwrap())
            .collect()
            .await;

        assert_eq!(
            out,
            vec![Bytes::from_static(DELTA), Bytes::from_static(DELTA)]
        );
    }

    #[tokio::test]
    async fn should_end_when_the_inner_stream_ends() {
        let empty = futures_util::stream::iter(chunks(&[]));
        let out: Vec<Result<Bytes, Infallible>> = with_keep_alive(empty, Duration::from_millis(20))
            .collect()
            .await;
        assert!(out.is_empty());
    }
}
