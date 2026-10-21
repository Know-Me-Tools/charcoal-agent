## ADDED Requirements

### Requirement: The reset notice can be closed with a tap-sized control

The control that closes the reset notice SHALL be at least 44 px wide and 44 px high at every viewport width, SHALL keep sonner's accessible name, and SHALL use the KnowMe tokens with no border, shadow or gradient.

#### Scenario: A phone-width viewport

- **WHEN** the reset notice is shown at a 320 px wide viewport
- **THEN** its close control measures at least 44 px by 44 px
- **AND** it is not covered by another element

#### Scenario: A desktop viewport

- **WHEN** the reset notice is shown at 1440 px wide
- **THEN** its close control measures at least 44 px by 44 px

#### Scenario: Closing it

- **WHEN** the visitor activates the close control
- **THEN** the notice is removed and does not return on reload

### Requirement: The reset notice test is stable under parallel load

The end-to-end test of the reset notice SHALL pass on every one of a recorded number of consecutive runs under the suite's parallel load, or the recorded result SHALL name the cause found and the fix, or state that the failure did not reproduce in that number of runs.

#### Scenario: Repeated runs

- **WHEN** the test is run the recorded number of times on the built app with the suite's parallelism
- **THEN** the number of failures and the evidence for each failure are recorded, and a failure's trace is kept until it has been read
