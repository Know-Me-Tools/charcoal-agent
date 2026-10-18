## ADDED Requirements

### Requirement: A streaming reply never leaves the visitor without an answer or a way out
The public chat SHALL keep its reply connection active while the model is silent and SHALL end a reply whose connection has died with a visible, retryable error instead of an endless "streaming" state.

#### Scenario: Silent model
- **WHEN** the model produces no output for more than 10 seconds
- **THEN** the site proxy sends an SSE comment frame so the connection is never silent for longer than about 10 seconds
- **AND** the client ignores the frame

#### Scenario: Dead connection
- **WHEN** the site build receives no bytes at all for 45 seconds while a reply is streaming
- **THEN** the page aborts the request and shows "The reply stopped before it finished" with a way to try again
- **AND** a visitor-initiated stop shows no error

### Requirement: Stream rendering work is bounded per frame
The chat client SHALL coalesce stream deltas so the message list is rebuilt at most once per animation frame, and SHALL not animate text character by character.

#### Scenario: Burst of deltas
- **WHEN** many deltas arrive within one frame
- **THEN** they are applied in a single flush, and the flush also runs on done, error and abort

#### Scenario: Backgrounded page
- **WHEN** the page is hidden and animation frames do not run
- **THEN** a timer flushes the buffered deltas so no text is lost
