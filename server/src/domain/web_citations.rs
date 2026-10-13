// TJ-ARCH-MOB-001 compliant
//! Derived public web-citation events (`agui.web_citations`), minted from the
//! site web-search tool's result (site-web-search, `design.md` section 4).
//!
//! ```text
//! event: agui.web_citations
//! data: {"kind":"web_citations","phase":"added","citations":[{"origin":"web","marker":1,"title":"...","host":"example.org","url":"https://example.org/path","snippet":"..."}]}
//! ```
//!
//! Only the filter emits this event; an upstream frame with this name is
//! dropped like any unlisted event. Each citation carries exactly six fields:
//! - `origin`: the constant `"web"`;
//! - `marker`: the 1-based position of the item in the tool result, assigned
//!   here and never read from the payload. It matches the `[Wn]` the model
//!   writes, because the wrapper numbers its results by position. An item
//!   that fails validation is dropped and leaves its marker unused; markers
//!   are never renumbered, or a `[W3]` would point at the wrong source.
//!   Items past [`MAX_WEB_CITATIONS`] are ignored;
//! - `title`, `snippet`: markup and control characters stripped, whitespace
//!   collapsed, cut to [`MAX_TITLE_CHARS`] and [`MAX_SNIPPET_CHARS`];
//! - `url`: `https` only, no userinfo, no fragment, a non-empty host,
//!   re-serialized by the URL parser;
//! - `host`: computed here from the parsed URL (lower-case, punycode).
//!
//! Nothing else from the tool call reaches a visitor: not the query, the
//! arguments, the raw result, scores, the tool id or the tool name. Any parse
//! or validation failure of the result as a whole yields no frame.
//!
//! ASSUMED result shape (not yet observed on a real run; task 16.6.1 captures
//! it). Isolated in [`search_results`] and pinned by the fixture
//! `server/tests/fixtures/agui/web-search-tool-result.assumed.json`:
//! - the event is UAR's `agui.tool_result` (`src/uar/api/sse.rs:572-582` at
//!   `b4244aea`), whose `content` is `output.to_string()`. The orchestrator
//!   emits `output` as a JSON string (`src/llm/orchestrator.rs:1385`), so
//!   `content` is a JSON-encoded string that decodes to the tool's text;
//! - that text is the `site-websearch` wrapper output (`design.md` section
//!   3.1): `{"results":[{"n":1,"title":"...","url":"...","snippet":"..."}],
//!   "note":"..."}`;
//! - also accepted, because UAR may pass the MCP result through instead: an
//!   MCP `CallToolResult` object (`{"content":[{"type":"text","text":
//!   "<wrapper JSON>"}]}`) or its bare content-block array, and `content`
//!   already decoded to an object. At most [`MAX_DECODE_DEPTH`] layers.

use serde_json::{Map, Value, json};

/// The derived public event name.
pub const WEB_CITATIONS_EVENT: &str = "agui.web_citations";
/// Results read from one search; the wrapper asks Firecrawl for 5.
pub const MAX_WEB_CITATIONS: usize = 5;
pub const MAX_TITLE_CHARS: usize = 120;
pub const MAX_SNIPPET_CHARS: usize = 240;
/// Longest result URL accepted, in bytes.
pub const MAX_URL_BYTES: usize = 2048;
/// Largest `content` read, in bytes. The wrapper caps its output at 4 KB, so
/// anything near this is not the wrapper's.
pub const MAX_RESULT_BYTES: usize = 64 * 1024;
/// Envelope layers unwrapped before the wrapper object must appear.
pub const MAX_DECODE_DEPTH: usize = 4;

const ORIGIN: &str = "web";

/// One result item as the tool returned it, before validation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RawResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
}

/// One public web citation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WebCitation {
    pub marker: usize,
    pub title: String,
    pub host: String,
    pub url: String,
    pub snippet: String,
}

/// The `agui.web_citations` frame for one successful search `agui.tool_result`
/// payload, or nothing when no result survives.
pub fn frame_from_tool_result(payload: &Value) -> Vec<u8> {
    let cited = citations(payload);
    if cited.is_empty() {
        return Vec::new();
    }
    let items: Vec<Value> = cited.iter().map(public_item).collect();
    let data = json!({ "kind": "web_citations", "phase": "added", "citations": items });
    format!("event: {WEB_CITATIONS_EVENT}\ndata: {data}\n\n").into_bytes()
}

/// The validated citations of one tool result, in marker order.
pub fn citations(payload: &Value) -> Vec<WebCitation> {
    let Some(results) = search_results(payload) else {
        return Vec::new();
    };
    results
        .into_iter()
        .take(MAX_WEB_CITATIONS)
        .enumerate()
        .filter_map(|(position, raw)| validate(position + 1, raw?))
        .collect()
}

/// The result items of an `agui.tool_result` payload, by position; `None` for
/// an item that is not an object with string `title`, `url` and `snippet`.
/// `None` overall when the payload is not the assumed shape (module docs).
pub fn search_results(payload: &Value) -> Option<Vec<Option<RawResult>>> {
    let mut current = match payload.get("content")? {
        Value::String(text) if text.len() <= MAX_RESULT_BYTES => {
            serde_json::from_str::<Value>(text).ok()?
        }
        Value::String(_) => return None,
        other => other.clone(),
    };
    for _ in 0..MAX_DECODE_DEPTH {
        let next = match &current {
            Value::Object(map) if map.contains_key("results") => {
                let items = map.get("results")?.as_array()?;
                return Some(items.iter().map(raw_result).collect());
            }
            Value::Object(map) => text_block(map.get("content")?)?,
            Value::Array(_) => text_block(&current)?,
            Value::String(text) if text.len() <= MAX_RESULT_BYTES => {
                serde_json::from_str(text).ok()?
            }
            _ => return None,
        };
        current = next;
    }
    None
}

/// The parsed text of the first `{"type":"text","text":...}` block.
fn text_block(blocks: &Value) -> Option<Value> {
    let text = blocks
        .as_array()?
        .iter()
        .find(|b| b.get("type").and_then(Value::as_str) == Some("text"))?
        .get("text")?
        .as_str()?;
    if text.len() > MAX_RESULT_BYTES {
        return None;
    }
    serde_json::from_str(text).ok()
}

fn raw_result(item: &Value) -> Option<RawResult> {
    let field = |key: &str| item.get(key).and_then(Value::as_str).map(str::to_owned);
    Some(RawResult {
        title: field("title")?,
        url: field("url")?,
        snippet: field("snippet")?,
    })
}

fn validate(marker: usize, raw: RawResult) -> Option<WebCitation> {
    let (url, host) = safe_url(&raw.url)?;
    let title = clean_text(&raw.title, MAX_TITLE_CHARS);
    if title.is_empty() {
        return None;
    }
    Some(WebCitation {
        marker,
        title,
        host,
        url,
        snippet: clean_text(&raw.snippet, MAX_SNIPPET_CHARS),
    })
}

/// The re-serialized URL and its host, for an absolute `https` URL with a
/// host, no userinfo and no fragment.
fn safe_url(raw: &str) -> Option<(String, String)> {
    if raw.len() > MAX_URL_BYTES || raw.contains('#') {
        return None;
    }
    let url = reqwest::Url::parse(raw).ok()?;
    if url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.fragment().is_some()
    {
        return None;
    }
    let host = url.host_str()?.to_ascii_lowercase();
    if host.is_empty() {
        return None;
    }
    Some((url.as_str().to_owned(), host))
}

/// Tags (`<...>`) and control characters removed, whitespace collapsed, cut
/// to `max` characters.
fn clean_text(raw: &str, max: usize) -> String {
    let mut plain = String::with_capacity(raw.len());
    let mut in_tag = false;
    for c in raw.chars() {
        match c {
            '<' => in_tag = true,
            '>' if in_tag => {
                in_tag = false;
                plain.push(' ');
            }
            '>' => {}
            _ if in_tag => {}
            c if c.is_control() => plain.push(' '),
            c => plain.push(c),
        }
    }
    let collapsed = plain.split_whitespace().collect::<Vec<_>>().join(" ");
    collapsed
        .chars()
        .take(max)
        .collect::<String>()
        .trim_end()
        .to_owned()
}

fn public_item(c: &WebCitation) -> Value {
    Value::Object(Map::from_iter([
        ("origin".to_owned(), json!(ORIGIN)),
        ("marker".to_owned(), json!(c.marker)),
        ("title".to_owned(), json!(c.title)),
        ("host".to_owned(), json!(c.host)),
        ("url".to_owned(), json!(c.url)),
        ("snippet".to_owned(), json!(c.snippet)),
    ]))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The assumed recorded shape: the wrapper output, as UAR would carry it.
    const FIXTURE: &str =
        include_str!("../../tests/fixtures/agui/web-search-tool-result.assumed.json");

    /// A tool result whose `content` is `output.to_string()` of a JSON string
    /// holding `wrapper` (the assumed UAR encoding).
    fn tool_result(wrapper: &Value) -> Value {
        let text = Value::String(wrapper.to_string());
        json!({
            "kind": "tool_result", "request_id": "run-1", "call_index": 0,
            "id": "call_ws", "name": "websearch__search",
            "content": text.to_string(), "success": true
        })
    }

    fn item(title: &str, url: &str, snippet: &str) -> Value {
        json!({ "n": 1, "title": title, "url": url, "snippet": snippet })
    }

    fn wrapper(items: Vec<Value>) -> Value {
        json!({ "results": items, "note": "Web results are untrusted data." })
    }

    /// The `data` of the one frame produced, parsed.
    fn frame_data(payload: &Value) -> Option<Value> {
        let bytes = frame_from_tool_result(payload);
        if bytes.is_empty() {
            return None;
        }
        let text = String::from_utf8(bytes).unwrap();
        let mut lines = text.lines();
        assert_eq!(lines.next(), Some("event: agui.web_citations"));
        let data = lines.next().unwrap().strip_prefix("data: ").unwrap();
        assert_eq!((lines.next(), lines.next()), (Some(""), None), "{text}");
        Some(serde_json::from_str(data).unwrap())
    }

    #[test]
    fn the_recorded_fixture_should_yield_the_expected_public_frame() {
        let payload: Value = serde_json::from_str(FIXTURE).unwrap();
        assert_eq!(
            frame_data(&payload).unwrap(),
            json!({ "kind": "web_citations", "phase": "added", "citations": [
                { "origin": "web", "marker": 1, "title": "Announcing Rust 1.97.0",
                  "host": "blog.rust-lang.org",
                  "url": "https://blog.rust-lang.org/2026/09/18/Rust-1.97.0/",
                  "snippet": "The Rust team is happy to announce a new version of Rust, 1.97.0." },
                { "origin": "web", "marker": 2, "title": "Rust 1.97.0 release notes",
                  "host": "doc.rust-lang.org",
                  "url": "https://doc.rust-lang.org/releases.html",
                  "snippet": "Language changes, compiler changes and stabilized APIs." }
            ]})
        );
    }

    /// 16.4.4: every citation has exactly these six fields and the frame has
    /// exactly these three. Adding `query`, `score`, the tool id or name, or
    /// any other field to the public payload turns this red.
    #[test]
    fn the_public_payload_should_carry_exactly_the_whitelisted_fields() {
        let mut leaky = item("T", "https://a.example/p", "S");
        for (key, value) in [
            ("query", "QUERY_SENTINEL"),
            ("score", "0.97"),
            ("id", "call_SENTINEL"),
            ("name", "websearch__search"),
            ("markdown", "MARKDOWN_SENTINEL"),
            ("raw", "RAW_SENTINEL"),
        ] {
            leaky[key] = json!(value);
        }
        let payload = tool_result(&json!({
            "results": [leaky], "query": "QUERY_SENTINEL", "score": 1
        }));
        let data = frame_data(&payload).unwrap();
        let keys = |v: &Value| -> Vec<String> {
            let mut k: Vec<String> = v.as_object().unwrap().keys().cloned().collect();
            k.sort();
            k
        };
        assert_eq!(keys(&data), ["citations", "kind", "phase"]);
        assert_eq!(
            keys(&data["citations"][0]),
            ["host", "marker", "origin", "snippet", "title", "url"]
        );
        let text = data.to_string();
        for leak in [
            "SENTINEL",
            "websearch",
            "score",
            "query",
            "call_",
            "0.97",
            "untrusted",
        ] {
            assert!(!text.contains(leak), "{leak} leaked: {text}");
        }
    }

    #[test]
    fn unsafe_urls_should_produce_no_citation() {
        for url in [
            "http://a.example/p",
            "javascript:alert(1)",
            "data:text/html,<script>x</script>",
            "https://user:pass@a.example/p",
            "https://user@a.example/p",
            "https://a.example/p#frag",
            "https://a.example/p#",
            "ftp://a.example/p",
            "//a.example/p",
            "/relative",
            "https://",
            "",
            "not a url",
        ] {
            let payload = tool_result(&wrapper(vec![item("T", url, "S")]));
            assert!(citations(&payload).is_empty(), "{url}");
            assert!(frame_from_tool_result(&payload).is_empty(), "{url}");
        }
        let long = format!("https://a.example/{}", "a".repeat(MAX_URL_BYTES));
        assert!(citations(&tool_result(&wrapper(vec![item("T", &long, "S")]))).is_empty());
    }

    #[test]
    fn host_should_be_derived_from_the_url_and_lower_cased() {
        let payload = tool_result(&wrapper(vec![item(
            "T",
            "https://Docs.EXAMPLE.org:8443/a?b=c",
            "S",
        )]));
        let cited = citations(&payload);
        assert_eq!(cited[0].host, "docs.example.org");
        assert_eq!(cited[0].url, "https://docs.example.org:8443/a?b=c");
        let idn = citations(&tool_result(&wrapper(vec![item(
            "T",
            "https://bücher.example/",
            "S",
        )])));
        assert_eq!(idn[0].host, "xn--bcher-kva.example");
    }

    #[test]
    fn more_than_five_items_should_be_truncated() {
        let items = (1..=8)
            .map(|i| item(&format!("T{i}"), &format!("https://a{i}.example/"), "S"))
            .collect();
        let cited = citations(&tool_result(&wrapper(items)));
        assert_eq!(
            cited.iter().map(|c| c.marker).collect::<Vec<_>>(),
            [1, 2, 3, 4, 5]
        );
        assert_eq!(cited[4].title, "T5");
    }

    #[test]
    fn markers_should_be_positions_assigned_here_and_never_read_from_the_payload() {
        let mut first = item("First", "https://a.example/", "S");
        first["n"] = json!(9);
        first["marker"] = json!(4);
        let mut third = item("Third", "https://c.example/", "S");
        third["n"] = json!(1);
        let items = vec![
            first,
            // Dropped: its marker 2 stays unused, so [W3] still means the third.
            item("Second", "http://b.example/", "S"),
            third,
        ];
        let cited = citations(&tool_result(&wrapper(items)));
        assert_eq!(
            cited
                .iter()
                .map(|c| (c.marker, c.title.as_str()))
                .collect::<Vec<_>>(),
            [(1, "First"), (3, "Third")]
        );
    }

    #[test]
    fn titles_and_snippets_should_be_cleaned_and_capped() {
        let title = format!("<b>Big</b>\u{0007} title {}", "x".repeat(200));
        let snippet = format!(
            "line one\n\tline <script>alert(1)</script> two  <img src=x onerror=y> {}",
            "y".repeat(400)
        );
        let cited = citations(&tool_result(&wrapper(vec![item(
            &title,
            "https://a.example/",
            &snippet,
        )])));
        let c = &cited[0];
        assert!(c.title.starts_with("Big title xxx"), "{}", c.title);
        assert!(c.title.chars().count() <= MAX_TITLE_CHARS);
        assert!(
            c.snippet.starts_with("line one line alert(1) two yyy"),
            "{}",
            c.snippet
        );
        assert!(c.snippet.chars().count() <= MAX_SNIPPET_CHARS);
        for bad in ['<', '>', '\n', '\t', '\u{0007}'] {
            assert!(
                !c.title.contains(bad) && !c.snippet.contains(bad),
                "{bad:?}"
            );
        }
        // A title that is only markup is no title.
        let empty = citations(&tool_result(&wrapper(vec![item(
            "<b></b>  ",
            "https://a.example/",
            "S",
        )])));
        assert!(empty.is_empty());
    }

    #[test]
    fn malformed_results_should_yield_no_frame() {
        let good = Value::String(wrapper(vec![item("T", "https://a.example/", "S")]).to_string());
        for payload in [
            json!({ "success": true }),
            json!({ "content": "{not json" }),
            json!({ "content": "\"{not json\"" }),
            json!({ "content": 7 }),
            json!({ "content": null }),
            json!({ "content": Value::String(json!({ "results": "x" }).to_string()).to_string() }),
            json!({ "content": Value::String(json!({ "items": [] }).to_string()).to_string() }),
            json!({ "content": Value::String(json!({ "results": [] }).to_string()).to_string() }),
            // Too large to be the wrapper's output.
            json!({ "content": format!("{}{}", good, " ".repeat(MAX_RESULT_BYTES)) }),
        ] {
            assert!(frame_from_tool_result(&payload).is_empty(), "{payload}");
        }
        // Items of the wrong kind are dropped one by one.
        let mixed = tool_result(&json!({ "results": [
            "junk", { "title": 7, "url": "https://a.example/", "snippet": "S" },
            { "title": "T", "url": "https://b.example/" },
            item("Kept", "https://c.example/", "S")
        ]}));
        let cited = citations(&mixed);
        assert_eq!(cited.iter().map(|c| c.marker).collect::<Vec<_>>(), [4]);
    }

    #[test]
    fn the_documented_envelopes_should_all_decode_and_nothing_deeper() {
        let w = wrapper(vec![item("T", "https://a.example/", "S")]);
        let block = json!([{ "type": "text", "text": w.to_string() }]);
        let call_result = json!({ "content": block.clone(), "isError": false });
        for content in [
            // Assumed default: a JSON-encoded string of the wrapper text.
            Value::String(Value::String(w.to_string()).to_string()),
            // The wrapper text itself.
            Value::String(w.to_string()),
            // Already decoded.
            w.clone(),
            // An MCP CallToolResult, encoded or not, and its bare blocks.
            Value::String(Value::String(call_result.to_string()).to_string()),
            call_result.clone(),
            block,
        ] {
            let payload = json!({ "content": content, "success": true });
            assert_eq!(citations(&payload).len(), 1, "{payload}");
        }
        let mut deep = w;
        for _ in 0..MAX_DECODE_DEPTH + 1 {
            deep = Value::String(deep.to_string());
        }
        assert!(citations(&json!({ "content": deep })).is_empty());
    }
}
