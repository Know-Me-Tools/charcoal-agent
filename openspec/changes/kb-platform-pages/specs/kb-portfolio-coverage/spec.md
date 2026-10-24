## ADDED Requirements

### Requirement: Every platform product has a knowledge-base page with its status and version
The knowledge base SHALL contain a page for each platform and infrastructure entry in the portfolio, stating what it is, its status in the portfolio's or repository's wording and its version line from the facts file. A page SHALL NOT state a planned or proposed product as available.

#### Scenario: A page exists
- **WHEN** the manifest is built
- **THEN** each platform entry in the facts file has a generated page

#### Scenario: Status is not overstated
- **WHEN** an entry's status is proposed or prototype
- **THEN** its page says so in its first paragraph
