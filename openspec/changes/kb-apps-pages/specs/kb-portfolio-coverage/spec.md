## ADDED Requirements

### Requirement: Every application product has a knowledge-base page that leads with its status
The knowledge base SHALL contain a page for each personal and application entry in the portfolio. The first paragraph of each page SHALL state the entry's status in the source's wording, and a proposed, planned or prototype entry SHALL NOT be described in the present tense as available.

#### Scenario: A proposal leads with its status
- **WHEN** an entry's facts status is proposed
- **THEN** its page opens by saying it is proposed

#### Scenario: The concierge does not promote a proposal
- **WHEN** a visitor asks whether a proposed product can be used today
- **THEN** the retrieved page supports the answer that it is not available
