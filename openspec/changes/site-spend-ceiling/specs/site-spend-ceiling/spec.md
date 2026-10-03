## ADDED Requirements

### Requirement: Reserve-and-settle token meter
The site server SHALL reserve the per-turn reservation size, in one transaction, against the daily and monthly token budgets in SurrealDB `ns=site` / `db=meter` before forwarding any turn, SHALL refuse the turn when the reservation would exceed a budget, and SHALL settle the reservation to `usage.total_tokens` from the run's `agui.done`, keeping the full reservation for any run that reports no usage.

#### Scenario: (1) Request fields do not escape metering
- **GIVEN** one chat request with `stream: false` and one with `stream_mode: agui_spec`
- **WHEN** each passes through the site server
- **THEN** each is reserved before forwarding and settled from `agui.done` of the pinned `dual` stream

#### Scenario: (2) Disconnected run keeps its reservation
- **GIVEN** a turn whose client disconnects before `agui.done`
- **WHEN** the run ends
- **THEN** the meter keeps the full `max_tokens_per_turn` reservation for it

#### Scenario: (3) Concurrent turns at the boundary
- **GIVEN** a daily total within N reservations of the budget
- **WHEN** N or more turns arrive concurrently
- **THEN** only the turns whose reservation fits are forwarded, and any overshoot equals the recorded excess of runs whose actual usage exceeded their reservation

#### Scenario: (4) Shared and durable total
- **GIVEN** two `knowme-web` replicas and a non-zero daily total
- **WHEN** turns land on both replicas and `knowme-web` is then rolled out
- **THEN** both replicas update the same total and the total is unchanged after the rollout

### Requirement: Meter fails closed
The site server SHALL refuse new turns with the offline state when the meter store is unreachable.

#### Scenario: (5) Meter path broken while UAR is healthy
- **GIVEN** UAR is up and the site server cannot reach or authenticate to the meter store
- **WHEN** a visitor sends a chat turn
- **THEN** the turn is refused with the offline state and UAR receives no chat call

#### Scenario: (6) Alerts fire
- **GIVEN** the daily total crosses 80% of the budget and then reaches it
- **WHEN** each threshold is crossed
- **THEN** the warning alert and the exhaustion alert each fire once

### Requirement: Kill switch from a mounted file
The site server SHALL read the kill switch from a mounted ConfigMap file and SHALL return the offline state on every replica within 60 seconds of a change, without a redeploy or restart.

#### Scenario: Kill switch flipped
- **GIVEN** the operator changes the kill switch in its ConfigMap
- **WHEN** the mounted file updates
- **THEN** within 60 seconds every replica returns the offline state

### Requirement: Per-turn usage record
The site server SHALL record model, input tokens, output tokens, time to first token and outcome for every completed or cancelled turn, with no session id and no message text.

#### Scenario: Turn recorded
- **GIVEN** a completed or cancelled turn
- **WHEN** it ends
- **THEN** one usage record exists with those fields and contains no session id or message text

#### Scenario: (7) Period rollover
- **GIVEN** no counter row exists yet for the current UTC day or month
- **WHEN** the first turn of the period arrives
- **THEN** the row is created on first use and the turn is admitted if it fits the budget

#### Scenario: Excess over reservation
- **GIVEN** a multi-call run whose actual usage exceeds its reservation
- **WHEN** its `agui.done` settles
- **THEN** the full actual usage is charged, the excess alert fires, and the excess is recorded
