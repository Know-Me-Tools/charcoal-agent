# chat-persistence Specification

## Purpose
Locally saved conversations (thread records and rendered message history kept in the browser) survive a reload or a closed page. They apply changes in the order they were made, and they tell the user when a save fails instead of losing it silently.

## Requirements

### Requirement: Finished replies are saved durably
When a reply stream finishes, the conversation SHALL save that reply and the user message that triggered it. After that, a reload or reopen SHALL show both, even when the reload starts immediately after the reply appears. The same SHALL hold when the stream ends in an error: the user message and the failed reply are both kept.

#### Scenario: Reload immediately after a reply
- **WHEN** a user sends a message, the reply finishes streaming, and the page is reloaded right after the reply text becomes visible with no deliberate wait
- **THEN** after the reload the conversation shows exactly one copy of that user message and exactly one copy of that reply, with the same text as before the reload

#### Scenario: Reply that ended in an error
- **WHEN** a reply fails and the page is reloaded right after the error is shown
- **THEN** after the reload the user message is still shown once and the failed reply shows its plain-language error, with no duplicate turn

#### Scenario: Reopen after the page was closed
- **WHEN** a reply has finished, the tab is closed, and the conversation is opened again in a new tab
- **THEN** the conversation shows the user message and the reply

### Requirement: Retry and Regenerate replacements survive a reload
When Try again or Regenerate replaces a turn, the saved conversation SHALL hold only the replacement. After a reload the user SHALL see one copy of the triggering user message, the replacement reply, and none of the replaced reply's content.

#### Scenario: Reload immediately after Try again
- **WHEN** a reply fails, the user selects Try again, the retried reply finishes, and the page is reloaded right after the retried reply appears
- **THEN** after the reload the conversation shows exactly one user message and exactly one assistant reply, the reply is the retried one, and no error text from the failed attempt is shown

#### Scenario: Reload immediately after Regenerate
- **WHEN** the user selects Regenerate on a finished reply, the new reply finishes, and the page is reloaded right after the new reply appears
- **THEN** after the reload the conversation shows exactly one user message and exactly one assistant reply, the reply is the regenerated one, and no text that only appeared in the replaced reply is shown

#### Scenario: Stable under repetition
- **WHEN** the reload-after-Try-again, reload-after-Regenerate and reload-after-reply checks are each run 20 times in a row on one worker
- **THEN** every run passes

### Requirement: Saves apply in the order they were made
The system SHALL apply local saves in the order they were made, across thread records and messages. A removal made before a later write SHALL never take effect after that write. A conversation's thread record SHALL be saved before its first messages. One failed save SHALL NOT prevent later saves from applying.

#### Scenario: Removal followed by a replacement
- **WHEN** a removal of a turn is requested and a replacement message for the same conversation is saved after it, with the removal still pending when the replacement is requested
- **THEN** the saved conversation contains the replacement and not the removed turn

#### Scenario: New conversation's first exchange
- **WHEN** a new conversation is created and its first reply finishes before any earlier save has completed
- **THEN** the thread record is saved before its messages, and no message save is rejected for lack of a thread record

#### Scenario: A failed save does not block later saves
- **WHEN** one save fails and further saves are requested after it
- **THEN** the later saves still apply, in order

#### Scenario: Completion can be awaited
- **WHEN** a caller waits for all saves requested so far to settle
- **THEN** the wait resolves only after every one of those saves has either applied or failed, and it resolves even when one of them failed

### Requirement: Save state is observable
The conversation view SHALL expose its current local save state as a machine-readable value on the view. The value SHALL be `saving` while any save is pending, `saved` when none is pending and the last save succeeded, and `failed` after a failed save until a later save succeeds. The value SHALL be readable without any test-only global or build flag.

#### Scenario: Saving then saved
- **WHEN** a reply finishes and its saves are in progress, and then those saves complete
- **THEN** the conversation view's save state reads `saving` and then `saved`

#### Scenario: Failed then recovered
- **WHEN** a save fails and a later save then succeeds
- **THEN** the save state reads `failed` after the failure and `saved` after the later success

### Requirement: Save failures are reported without breaking the conversation
When a local save fails, the system SHALL show a quiet, non-blocking notice with the text "Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload." The notice SHALL be announced politely to assistive technology, SHALL NOT take focus or block input, and SHALL NOT expose raw error text. Several failures close together SHALL produce one notice, not one per failed save. The conversation SHALL stay readable and the composer SHALL stay usable.

#### Scenario: A save fails
- **WHEN** a save of a finished reply fails
- **THEN** the notice text above appears once, focus stays where it was, the reply stays on screen, and the user can send another message

#### Scenario: Several saves fail together
- **WHEN** several saves from one finished turn fail
- **THEN** only one notice is shown for that burst

#### Scenario: No raw errors
- **WHEN** a save fails with a database error message
- **THEN** the notice shows only the plain-language text, and the database error is logged for diagnosis, not displayed

### Requirement: Saves pending at page exit are kept where the browser allows
When the page is hidden or unloaded while saves are pending, the system SHALL record those pending saves synchronously. On the next start it SHALL apply them in their original order before any conversation is shown. Applying a recorded save that had already taken effect SHALL leave the saved conversation unchanged. The browser cannot delay unload until a database write completes. Saves pending when the page ends without a hide or unload signal (a crash, a killed process, or an app quit that fires neither) MAY be lost. The system SHALL NOT claim otherwise.

#### Scenario: Reload while saves are pending
- **WHEN** the page is reloaded while saves for a finished reply are still pending
- **THEN** on the next start those saves apply before the conversation is shown, and the conversation shows the reply

#### Scenario: A recorded save had already applied
- **WHEN** a recorded pending save had in fact completed before the page closed and is applied again on the next start
- **THEN** the conversation contains no duplicate messages and no removed turn reappears

#### Scenario: A recorded save cannot be applied on the next start
- **WHEN** a recorded pending save fails to apply on the next start
- **THEN** the remaining recorded saves still apply in order, the save-failure notice is shown once, and the app finishes starting

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
