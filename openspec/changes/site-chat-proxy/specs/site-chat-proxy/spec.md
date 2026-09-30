## ADDED Requirements

### Requirement: Pinned public chat
The site proxy SHALL route public chat only to `knowme-site` with the server-held API key, whatever agent, model or run policy the client sends.

#### Scenario: Pinned public chat
- **GIVEN** a browser request naming another agent and model
- **WHEN** it passes through the site proxy
- **THEN** UAR runs `knowme-site` on `qwen3.8-max` and the browser never held a credential
