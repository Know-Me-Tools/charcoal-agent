## ADDED Requirements

### Requirement: Content Security Policy
The site server SHALL send a Content-Security-Policy that allows the inline theme script only by its hash, first as `Content-Security-Policy-Report-Only` and, after one week with zero violations, as an enforced `Content-Security-Policy`.

#### Scenario: Report-only with no violations
- **GIVEN** the site build served with the report-only CSP
- **WHEN** a visitor loads the site and completes a chat turn
- **THEN** the response carries the report-only header and no violation is reported

#### Scenario: Enforced after a clean week
- **GIVEN** a week of report-only with zero violations
- **WHEN** the policy is switched to enforced
- **THEN** `curl -I` shows `Content-Security-Policy` and the site still loads and chats

### Requirement: HSTS and Permissions-Policy
Responses for the site hosts SHALL carry `Strict-Transport-Security`, set at Envoy, and `Permissions-Policy`, set by the site server.

#### Scenario: Live headers
- **GIVEN** the deployed site
- **WHEN** `curl -I` requests the root
- **THEN** both headers are present
