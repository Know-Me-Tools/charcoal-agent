## ADDED Requirements

### Requirement: The product directory and product pages follow one design brief
The site SHALL present the product directory and product pages from a written design brief in docs/design that fixes the page inventory, the status vocabulary, the ask-the-concierge entry patterns and the layout at 320 px and 1440 px in the light and dark themes. Status SHALL never be conveyed by colour alone.

#### Scenario: Status is not colour alone
- **WHEN** a product card shows its status
- **THEN** the status is also given as text

#### Scenario: The brief covers both widths and themes
- **WHEN** the brief is reviewed
- **THEN** comps exist at 320 px and 1440 px in both themes
