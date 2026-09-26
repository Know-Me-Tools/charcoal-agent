# Multiple tabs

## Tab identity

- The tab id is kept in `sessionStorage`. It survives reloads and tab restore, and it is unique per tab, **except** that "Duplicate tab" copies it.
- At install, request your own key's lock with `{ifAvailable: true}`:
  - Granted: you are the only live tab with this id. Hold the lock for the page's lifetime.
  - Not granted: this is a duplicate. Mint a new id, store it in `sessionStorage`, and take the new lock. Don't replay or clear the original's key.
- Without `navigator.locks`, fall back to replaying your own key only, and leave other tabs' keys alone.

## Claiming dead tabs' journals

For each other key: `navigator.locks.request(key, {ifAvailable: true}, cb)`. If `cb` receives a lock, that tab is dead. Replay its journal, then remove the key.

Each replayed descriptor from another tab passes these guards:
- **Scrubbed on delete:** a delete in any tab has already removed the entity's descriptors from every key, synchronously, in the same task as the delete.
- **Newer wins:** an `upsert` or `touch` of a parent row applies only if its `updatedAt` is not older than the stored row's. Ties apply, since an equal timestamp from the same logical write is idempotent. Store timestamps at millisecond resolution or finer. Where two tabs can write the same row in the same millisecond, add a tiebreaker (a per-tab sequence number).
- **Missing row:** an upsert of a parent row with no stored row is a creation, so apply it. A child descriptor whose parent is missing is skipped and logged, not reported to the user as a save failure.

## Tests that prove the harmful half

Tests that only show "a live tab's key is left alone" prove the safe half. Also write these:
1. Tab A journals an upsert of entity E and dies. The user deletes E in tab B. A fresh start must **not** bring E back.
2. Tab A journals an old title. Tab B renames with a newer timestamp. Replay must keep the newer title.
3. A duplicated tab starts with the original alive. The original's key must be untouched, and the duplicate must get a new id.
4. The page hides with an empty queue, then writes are queued while hidden. The journal must contain them.

Run them against real storage (in-memory PGlite, or a real browser), not a fake store.
