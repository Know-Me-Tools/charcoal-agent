## ADDED Requirements

### Requirement: The ten most important products each have a short page with a way into the chat
The public site SHALL serve /products and a page at /products/<slug> for each of the ten listed products. Each page SHALL state what the product is, its status as text, its version line from the facts file, three to five sourced facts and an inline ask-the-concierge composer. An unknown slug SHALL render the not-found page.

#### Scenario: A product page renders
- **WHEN** a visitor opens /products/universal-agent-runtime
- **THEN** the page shows the status, the version line and an ask composer

#### Scenario: An unknown slug is not found
- **WHEN** a visitor opens /products/no-such-product
- **THEN** the not-found page renders
