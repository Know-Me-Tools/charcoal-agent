# Page-exit journal

## Format

```json
{ "version": 1, "descriptors": [ { "kind": "upsertThread", "...": "..." }, { "kind": "upsertMessage", "...": "..." } ] }
```

- Version the payload. On replay, discard an unknown version rather than guessing.
- Store descriptors in queue order. Replay depends on that order: parent rows before children, deletes before their replacements.

## When to write, rewrite and clear

| Event | Action |
|---|---|
| `pagehide`, or `visibilitychange` to `hidden` | Write the unsettled suffix if anything is pending |
| Queue changes while `document.visibilityState === "hidden"` | Write the suffix if anything is pending, even with no key yet |
| Queue changes while a key exists | Rewrite it to the current pending set, and remove it when that set is empty |
| Startup | Replay, then clear the key (§ Replay) |
| Database purged after corruption | Discard the journal without replaying, and report the loss |

## Replay

1. Open the database and run migrations.
2. Read this tab's key and apply its descriptors in order through the same `applyDescriptor` the queue uses. There must be one code path for writes.
3. If a descriptor fails, report it through the latch (SKILL.md §7), then carry on with the rest. Don't stop, and don't keep the failed descriptor: it will fail the same way on every start. If replay is interrupted by an exception outside a descriptor, such as storage access, leave the key in place so the next start can try again.
4. Clear the key, then claim dead tabs' keys (see `multi-tab.md`).
5. Only then mark the app ready. Guard the whole replay so that no exception, including a storage-access error, can stop startup.

## Quota shrink

`localStorage` holds about 5 MB per origin. If `setItem` throws:
1. Drop `upsert`-type descriptors, largest first, until the rest fits. Keep deletes and parent rows: they are small, and they are what makes retries correct.
2. Keep the order of whatever survives.
3. Report the loss once through the failure notice.

## What it stores

Journals hold the same content as the database: prompts, replies, tool output. That is not a new exposure, since both are same-origin. But dead tabs' keys can stay until a later start claims them. Clear them on delete (scrub) and after a purge.
