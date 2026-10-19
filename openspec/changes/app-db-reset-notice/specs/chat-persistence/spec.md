## ADDED Requirements

### Requirement: Visitor is told when saved chats are reset

When the local database is deleted and recreated because it could not be read, the app SHALL show the visitor one plain notice, once, after the new database is ready. The notice SHALL say that saved chats on this device were reset. The app SHALL NOT show the notice on a normal start or on later loads after the reset.

#### Scenario: Database unreadable on open

- **WHEN** opening the local database fails with a corruption error and the purge-and-reopen succeeds
- **THEN** the visitor sees the reset notice once
- **AND** the app opens with an empty chat list

#### Scenario: Normal start

- **WHEN** the local database opens without error
- **THEN** no reset notice is shown

#### Scenario: Reload after a reset

- **WHEN** the visitor reloads after the reset notice was shown
- **THEN** no reset notice is shown again

#### Scenario: Reopen also fails

- **WHEN** the reopen after the purge fails
- **THEN** the existing database error screen is shown and no reset notice is shown
