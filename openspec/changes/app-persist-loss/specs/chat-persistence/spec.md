## ADDED Requirements

### Requirement: Hydration never reverts a thread already in memory
Loading the stored threads into the registry SHALL add only threads the registry does not already hold, so a thread promoted this session is not reverted to its older stored copy.

#### Scenario: First send completes before the stored threads load
- **GIVEN** the front page registered a thread and the first exchange has completed and promoted it
- **WHEN** the stored-threads read returns the earlier, ephemeral copy of that thread
- **THEN** the thread stays persisted in memory and in the database, and is listed after a reload

#### Scenario: Stored threads are still loaded
- **GIVEN** the registry does not hold a stored thread
- **WHEN** the stored-threads read returns it
- **THEN** the registry holds it and is marked hydrated
