## ADDED Requirements

### Requirement: No session ids in access logs
The site server SHALL NOT write the visitor's thread id, the derived upstream session id, or cookies to any log line, and container logs SHALL be retained for 30 days or less.

#### Scenario: Chat turn leaves no session id in logs
- **GIVEN** a chat turn sent with `X-UAR-Session-ID` set to a known UUID
- **WHEN** the site server's logs for that request are read
- **THEN** neither the UUID nor the derived upstream session id appears

#### Scenario: Retention bound configured
- **GIVEN** the rendered cluster manifests and log configuration
- **WHEN** the log retention setting for the `knowme` namespace is read
- **THEN** it is 30 days or less

### Requirement: Site privacy notice
The site SHALL publish a privacy notice, linked from the composer and the footer, that names Alibaba Cloud as processor, Singapore as transfer destination, the retention period (D-5), every server-side store, the request-based erasure process and the data-request contact (D-8), and that states only what FR-33 and FR-41 have been shown to do.

#### Scenario: Visitor follows the privacy link
- **GIVEN** the composer or the footer
- **WHEN** the visitor follows the privacy link
- **THEN** the notice loads and names the processor, the transfer destination, the retention period, the stores, the erasure process and the data-request contact

#### Scenario: No unproven claims
- **GIVEN** FR-20's per-conversation delete has not shipped
- **WHEN** the notice is reviewed against the claim-to-evidence table
- **THEN** it mentions no delete control, and every retention and memory claim cites a passing test

#### Scenario: Approval gate
- **GIVEN** no approval record in `docs/content/reviews/site-privacy-notice.md`
- **WHEN** the notice would be published
- **THEN** publication is blocked
