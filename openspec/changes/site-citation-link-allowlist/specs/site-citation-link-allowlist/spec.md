## ADDED Requirements

### Requirement: Citation links only to allowlisted destinations
A citation URL SHALL render as a link only if it is an `https:` URL that exactly matches a URL string in the corpus or whose host exactly matches a host on the site-owned allowlist; any other URL SHALL render as plain text showing the full destination.

#### Scenario: Corpus URL renders as a link
- **GIVEN** a citation whose URL is a URL string that appears in `content/knowledge/*.md`
- **WHEN** the citation renders
- **THEN** it is a link that opens in a new tab

#### Scenario: Unknown URL renders as text
- **GIVEN** a citation whose URL is `https://evil.example/x`
- **WHEN** the citation renders
- **THEN** no anchor element is produced and the full URL is shown as plain text

#### Scenario: Lookalike host rejected
- **GIVEN** a citation whose URL host is `know-me.tools.evil.example`, or whose scheme is `javascript:` or `http:`
- **WHEN** the citation renders
- **THEN** it renders as plain text, not as a link
