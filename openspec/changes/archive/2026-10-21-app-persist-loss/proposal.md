## Why

In about 3 to 13 percent of first questions asked in the front-page composer, the conversation is stored but never listed: after a reload the thread is hidden from the sidebar and the front page shows no saved conversation. Reproduced on the built site-flavour app (`e2e/home-resume-chat.spec.ts`, 4 workers, 0 retries): 14 of 110 runs failed, and in every failure the stored thread row had `is_ephemeral = true` with both messages present and the generated title.

Cause: `useDbHydration` (mounted in `AppLayout`, so not on the front page) reads the stored threads only after the thread page mounts. The first send can finish before that read returns. `initFromDb` then overwrites the in-memory thread, already promoted by `markPersisted`, with the stored copy from before the promotion (ephemeral, "New conversation"). The title write that follows persists that reverted copy, so the row ends ephemeral.

## What Changes

- `initFromDb` in `src/stores/thread-registry-store.ts` keeps a thread already in memory and only adds stored threads the registry does not know.
- Lands in: this repo. Owner: km-frontend-engineer.

## Impact

- Capability: `chat-persistence`.
