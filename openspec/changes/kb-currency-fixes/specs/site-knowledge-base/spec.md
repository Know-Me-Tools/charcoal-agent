## ADDED Requirements

### Requirement: Knowledge-base pages take product versions from the facts file
The knowledge-base build SHALL resolve {{v:<product-id>}} placeholders from docs/knowledge-source/product-facts.json and the validator SHALL fail the build on an unresolved placeholder or an unknown product id. A page SHALL NOT hard-code a version for a product that has a facts row.

#### Scenario: A placeholder is resolved
- **WHEN** a source page contains {{v:uar-stable}}
- **THEN** the generated page contains the facts-file version

#### Scenario: An unknown placeholder fails
- **WHEN** a source page contains {{v:no-such-product}}
- **THEN** validate-kb exits non-zero and names the page
