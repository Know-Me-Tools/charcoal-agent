## ADDED Requirements

### Requirement: Client and clinical entries are described without infrastructure or site specifics
Public content SHALL describe a client, partner or clinical entry by what it is and its status only. It SHALL NOT state hardware models, network or control-plane design, office or site identity or pilot arrangements, and SHALL NOT state a certification or deployment the source does not state.

#### Scenario: Withheld terms are rejected
- **WHEN** a page under content/ contains a term in the withheld list
- **THEN** the check exits non-zero and names the file

#### Scenario: Status is quoted, not upgraded
- **WHEN** PatientGPT is a published plan, not deployed and not HIPAA-certified
- **THEN** its page says it is a plan, not deployed and not certified
