## ADDED Requirements

### Requirement: A message is never written before its thread row

When a visitor sends a message on a thread whose id the thread registry does not yet know, the app SHALL wait for the registry to be hydrated from the local database, then register the thread if it is still unknown, before the stream starts and before any message of that thread is enqueued for saving. The app SHALL NOT register a thread before the registry is hydrated, so a stored thread is never overwritten as a new ephemeral one.

#### Scenario: Send before the registry is hydrated, unknown thread id

- **WHEN** the visitor sends the first message on a thread route for an unknown id while the registry is still hydrating
- **THEN** the thread row is written before either message of the exchange
- **AND** no foreign-key failure is raised and no save-failure toast is shown
- **AND** the thread appears in the sidebar after the reply and receives its title on the first exchange

#### Scenario: Send before the registry is hydrated, stored thread id

- **WHEN** the visitor opens the route of a thread that is stored in the local database and sends a message before the registry is hydrated
- **THEN** the stored thread keeps its title and its earlier messages
- **AND** it is not replaced by a new ephemeral thread

#### Scenario: A reload after the first exchange

- **WHEN** the visitor reloads after the first exchange on a previously unknown thread id
- **THEN** both messages of that exchange are still there

#### Scenario: The hydration read fails

- **WHEN** reading the stored threads fails and the registry flips to hydrated with an empty list
- **THEN** a send still starts and the visitor gets a reply
- **AND** the send does not wait indefinitely for hydration
