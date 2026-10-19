# Review record: Saved chats reset notice

- **Piece:** `content/site/db-reset-notice.ts` -> `DB_RESET_NOTICE_CONTENT.text`, change `app-db-reset-notice`, phase `site-chat-follow-ups`.
- **String (draft):** "Your saved chats on this device could not be read, so this device's chat history was reset."
- **Where it appears:** one toast (`src/components/common/persistence-notices.tsx`, top centre, about 12 seconds), once, after the browser database could not be read, was deleted and was created again, and only in the page load where that happened. Not on a normal start, not on later loads, not when the reopen also fails (that case keeps the existing "Database error" screen).
- **Why:** before this change the wipe was silent. A visitor with saved chats lost them with no trace except a console warning.
- **What it must not claim:**
  - It must not promise or hint that the chats can be recovered, exported or restored. They cannot: the database is already unreadable when the error is thrown, and nothing is copied before the wipe.
  - It must not name a cause (no "corrupt", "bug", "update" or "storage full"); the cause is not known at that point.
  - It must not claim the data was or was not sent elsewhere. It speaks only about this device.
  - No hype language, no exclamation mark, no apology theatre.
- **Claims checked against the system:** "could not be read" is the condition that triggers the path (PGlite throws an error naming a bundle size on open). "reset" matches what happens: `purgeDatabase` deletes the IndexedDB `/pglite/charcoal-db` and the app reopens with an empty database.
- **Status:** pre-review pending. The chief content officer's editorial pre-review has not run on this string. Operator approval: not given. This record is not approved.
