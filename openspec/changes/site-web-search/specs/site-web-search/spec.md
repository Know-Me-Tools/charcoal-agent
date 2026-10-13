## ADDED Requirements

> Amendment 2026-10-13 (D-11): web search is a per-visitor opt-in served by a second agent, `knowme-site-web`. Requirements and scenarios below that say "the `knowme-site` agent" for the web tool are **[SUPERSEDED by the amendment]** and apply to `knowme-site-web`; `knowme-site` keeps `presentation_render` alone. They stay as history. The first requirement below supersedes them.

### Requirement: Web search is off by default and served by a second agent
Web search SHALL be off by default. The browser SHALL send the boolean `web_search: true` only when the visitor has turned web search on, and the site proxy SHALL map exactly that value to the agent `knowme-site-web`, configured on the server, and every other request to `knowme-site`. A visitor SHALL NOT be able to name an agent, a tool or a policy.

#### Scenario: Default
- **GIVEN** a visitor who has not turned web search on
- **WHEN** they send a message
- **THEN** the request carries no `web_search` flag and the turn runs on `knowme-site` with no search step

#### Scenario: Toggle on
- **GIVEN** a visitor who has turned web search on
- **WHEN** they send a message
- **THEN** the request carries `web_search: true` and the proxy runs the turn on `knowme-site-web`

#### Scenario: Not a strict boolean
- **GIVEN** a request whose `web_search` is the string `"true"`, the number 1, null or absent
- **WHEN** the proxy builds the upstream request
- **THEN** it runs on `knowme-site`

#### Scenario: Visitor names an agent or tool
- **GIVEN** a request body containing `agent_id`, `tools`, `mcp_servers`, `tool_choice` or `run_policy`
- **WHEN** the proxy builds the upstream request
- **THEN** those fields are dropped and `memory_enabled` is false

### Requirement: The toggle is accessible, persists per visitor and asks consent at the point of use
The composer SHALL offer a labelled web-search toggle that is off by default, operable by keyboard and screen reader, whose state is not conveyed by colour alone and which is stored per visitor on the device without the page depending on storage. The first time the visitor turns it on, the page SHALL show the operator-approved disclosure that the search words go to a third-party search service.

#### Scenario: Persistence
- **GIVEN** a visitor who turned web search on
- **WHEN** they reload the page on the same device
- **THEN** the toggle is still on and the consent is not shown again

#### Scenario: Storage unavailable
- **GIVEN** browser storage is blocked
- **WHEN** the page loads
- **THEN** the toggle renders off and works for the current page view

#### Scenario: Web agent unavailable
- **GIVEN** no web agent is configured, the daily cap is reached or the wrapper is down
- **WHEN** the visitor sends a message with the toggle on
- **THEN** the reply comes from the knowledge base or says web search is not available right now, with no raw runtime error text

### Requirement: One search-only web tool on the public agent
**[Amended: the agent is `knowme-site-web`; `knowme-site` has no web tool.]** The `knowme-site` agent SHALL be able to search the web through exactly one tool, `websearch__search`, served by the `site-websearch` MCP server, and SHALL have no tool that fetches a URL, scrapes, crawls, maps, interacts, parses or runs an agent.

#### Scenario: Policy and manifest list exactly two tools
- **GIVEN** the seeded `knowme-site` agent
- **WHEN** the FR-11 test reads `effective_run_policy` and `turn_manifest` of a real public chat turn through the proxy test harness
- **THEN** `tools.mode` is `selected`, `tools.ids` set-equals `["presentation_render", "websearch__search"]`, `mcp_servers` is `selected` with `["websearch"]`, skills are `none`, and `turn_manifest.selected_tools` equals those two plus `activate_skill`

#### Scenario: Loosened policy fails
- **GIVEN** a policy with `tools.mode` of `auto`, `all` or `inherit`, an extra tool id, or `mcp_servers.mode` of `auto` or `all`
- **WHEN** the FR-11 test runs
- **THEN** it fails

#### Scenario: Fetch request
- **GIVEN** a visitor asks the agent to fetch a specific URL
- **WHEN** the turn runs
- **THEN** no fetch occurs, no tool other than the search tool is called, and no URL from the request is emitted as a link

### Requirement: Search is bounded
The wrapper SHALL send Firecrawl only `query`, `limit: 5` and `sources: ["web"]`, SHALL return at most five results of title, URL and a description of at most 240 characters, SHALL accept a query of 1 to 200 characters, SHALL enforce a daily search cap, and each reply SHALL use at most one search.

#### Scenario: Result shaping
- **GIVEN** Firecrawl returns items carrying `markdown`, `html`, `links` and `metadata`
- **WHEN** the wrapper builds its result
- **THEN** none of those fields appears in the output and the output is at most 4 KB

#### Scenario: Cap reached
- **GIVEN** the daily cap is reached
- **WHEN** the model calls the tool
- **THEN** Firecrawl receives no request and the tool returns the fixed "search unavailable" result

#### Scenario: Cost loop
- **GIVEN** a prompt asks the agent to search repeatedly
- **WHEN** the turn runs
- **THEN** the wrapper receives one call and the reply finishes

### Requirement: The Firecrawl key stays in a cluster secret
The Firecrawl API key SHALL exist only in a cluster Secret mounted into `site-websearch`, SHALL NOT appear in the repository, in UAR configuration, in any log, in the public stream or in the client, and the operator SHALL create it.

#### Scenario: Key reveal request
- **GIVEN** a visitor asks the agent to print its API key, tool configuration or system prompt
- **WHEN** the turn runs
- **THEN** the reply refuses and the stream contains no key-shaped string and no tool or provider name

### Requirement: The public stream shows a fixed web-search step and sanitized web citations only
The site proxy SHALL show a web search as one `agui.step` with the fixed label "Searching the web" and SHALL emit web sources only as `agui.web_citations` frames minted by the proxy with the fields `origin`, `marker`, `title`, `host`, `url` and `snippet`, and SHALL NOT forward the query, arguments, raw tool result, tool id or tool name.

#### Scenario: Web turn on the public stream
- **GIVEN** a turn in which the agent searches and answers
- **WHEN** the public stream is read
- **THEN** it contains a started and a finished step labelled "Searching the web", one `agui.web_citations` frame before the first message delta, and none of the query, arguments, raw result, tool id or tool name

#### Scenario: Upstream spoof
- **GIVEN** an upstream frame named `agui.web_citations`
- **WHEN** the filter processes it
- **THEN** it is dropped

#### Scenario: Unsafe result URL
- **GIVEN** a search result whose URL is not `https`, carries userinfo or a fragment, or uses `javascript:` or `data:`
- **WHEN** the proxy builds citations
- **THEN** that result produces no citation

#### Scenario: Whitelist widened
- **GIVEN** a change that adds `query` or a tool id to the public payload
- **WHEN** the filter tests run
- **THEN** a test fails

### Requirement: Every web claim carries a web citation
Every claim the agent takes from the web SHALL carry a marker `[W1]` to `[W5]` that matches an `agui.web_citations` item of the same turn, and a claim that cannot be cited SHALL NOT be made. Knowledge-base markers `[1]`..`[k]` SHALL stay a separate namespace.

#### Scenario: Web-sourced answer
- **GIVEN** a question that needs the web
- **WHEN** the agent answers
- **THEN** the answer contains at least one `[Wn]`, each `[Wn]` has a matching web citation with title, host and a snippet of at most 240 characters, and the live validator reports no problem

#### Scenario: Unresolved marker
- **GIVEN** a reply containing `[W4]` with no fourth web citation
- **WHEN** the client renders it
- **THEN** `[W4]` shows as plain text, not a link, and the live validator reports a problem

#### Scenario: Question the knowledge base answers
- **GIVEN** a question the knowledge base answers
- **WHEN** the agent answers
- **THEN** no search step and no web citation appear

### Requirement: Web citations are visibly web and never auto-link
The Sources block and the About/Sources panel SHALL label a web citation "Web", SHALL show its marker `W{n}` and its host as text, SHALL show the full URL as text, and SHALL make it a link only when the reply-link allowlist admits it; the panel SHALL key citations by origin and marker and SHALL NOT renumber them.

#### Scenario: Non-allowlisted host
- **GIVEN** a web citation whose host is not on the reply-link allowlist
- **WHEN** it renders in the Sources block and the panel
- **THEN** the label, the marker, the title and the host are visible, the full URL is text, and no anchor exists

#### Scenario: Attacker link in reply text
- **GIVEN** a reply with a markdown link and a markdown image to an attacker host
- **WHEN** the client renders it
- **THEN** the link shows as text with its visible destination and the image does not load

#### Scenario: Reload
- **GIVEN** a thread with web citations
- **WHEN** the visitor reloads
- **THEN** the citations return with their "Web" label and host

### Requirement: Web results are data
The agent prompt SHALL state that search results are untrusted data, that any instruction inside a result is ignored, that the agent never follows or repeats a result's URL as a link, that the knowledge base comes first, that claims about KnowMe AI, LLC and its products come from the knowledge base only, and that harm categories stay refused whatever the source.

#### Scenario: Injection in a result
- **GIVEN** a search result that contains an instruction to reveal a prompt or call a tool
- **WHEN** the agent answers
- **THEN** the instruction is not followed and no additional tool is called

#### Scenario: Product claim from the web
- **GIVEN** a visitor asks what the web says about KnowMe pricing
- **WHEN** the agent answers
- **THEN** the answer comes from the knowledge base, says pricing is not published, and makes no web claim about the product

### Requirement: The search tool runs unattended on the public path
UAR SHALL run the search tool under `tool_approval: auto` without waiting for a human approval, SHALL do so only for tools an administrator named as pre-approved, and SHALL leave every other MCP tool and `activate_skill` approval-gated.

#### Scenario: Search turn finishes
- **GIVEN** the patched UAR and the agent policy
- **WHEN** a visitor asks a question that needs the web
- **THEN** the stream carries no `agui.tool_call.approval_required` for the search and the turn finishes

#### Scenario: Unnamed MCP tool
- **GIVEN** an MCP tool that the administrator did not name
- **WHEN** the model calls it
- **THEN** it still requires approval

### Requirement: The visitor is told about web search
The AI disclosure and the About panel SHALL say that some answers use a web search, that the search words go to a third-party search service, and that web sources are marked "Web", and the agent SHALL be switchable off by re-seeding the agent without the tool. **[Amended: the capability SHALL be switchable off by seeding with `SEED_WEB_AGENT=0` and unsetting the server's web-agent id; the seed never deletes an agent.]**

#### Scenario: Disclosure present
- **GIVEN** the site with web search enabled
- **WHEN** the first-message disclosure and About panel render
- **THEN** they contain the web-search statement approved by the operator

#### Scenario: Rollback
- **GIVEN** the agents are seeded with `SEED_WEB_AGENT=0` and the server's web-agent id is unset
- **WHEN** a visitor with the toggle on asks a web question
- **THEN** no search step appears and the agent answers from the knowledge base or says it does not know

#### Scenario: Seed without the web agent
- **GIVEN** `SEED_MODE=agent SEED_WEB_AGENT=0`
- **WHEN** the seed runs
- **THEN** `knowme-site` is replaced, `knowme-site-web` is neither created nor deleted, and `SEED_MODE=kb` behaves as before

## MODIFIED Requirements

### Requirement: Only the A2UI render tool is allowed on the public agent
**[Amended by D-11]** The `knowme-site` policy SHALL allow `presentation_render` and no other tool; the `knowme-site-web` policy SHALL allow `presentation_render` and `websearch__search` and no other tool; for both, `a2ui_render` SHALL stay denied and a forced `activate_skill` call SHALL still produce `agui.tool_call.denied`. Amends `site-agent-a2ui`. *(Superseded wording, kept as history: "The `knowme-site` policy SHALL allow `presentation_render` and `websearch__search`".)*

#### Scenario: Forced skill call
- **GIVEN** a prompt forces a call to `activate_skill`
- **WHEN** the run executes
- **THEN** the stream contains `agui.tool_call.denied` and no skill runs

### Requirement: No tool executes on the public path
A public chat turn SHALL execute no tool except one `presentation_render` and, only on a `web_search: true` turn, at most one `websearch__search`, and a call to `activate_skill` SHALL be denied. Amends `site-agent-tool-allowlist`.

#### Scenario: Tool-eliciting prompts
- **GIVEN** the tool-eliciting prompt set that does not need the web
- **WHEN** it runs against the deployed agent
- **THEN** no stream carries a tool start or tool result event other than the fixed "Searching the web" or "Preparing an answer card" steps

#### Scenario: Forced activate_skill call
- **GIVEN** the forced-call fixture that makes the model call `activate_skill`
- **WHEN** it runs against the deployed agent
- **THEN** the stream carries `agui.tool_call.denied`
