# IPFS Sync for Obsidian

IPFS Sync for Obsidian is an early-preview Obsidian plugin and CLI from KnowMe AI, LLC. IPFS Sync for Obsidian syncs a vault over IPFS through a user's own kubo node, with no Obsidian Sync subscription and no third-party cloud. IPFS Sync for Obsidian is a pre-release, tested on fixture vaults only — do not use IPFS Sync for Obsidian on real notes yet.

## Status — early preview, not for real notes

IPFS Sync for Obsidian is at v0.2.0, a pre-release. Everything in IPFS Sync for Obsidian today has been tested on fixture (test) vaults only, and IPFS Sync for Obsidian's own documentation says plainly not to use it on real notes. IPFS Sync for Obsidian does not yet encrypt data — encryption is planned but not shipped — so anyone with a file's address on the user's IPFS node can read it. Wait for an encrypted release before trusting IPFS Sync for Obsidian with anything sensitive. (Source: IPFS Sync for Obsidian README, changelog)

## Who IPFS Sync for Obsidian is for

IPFS Sync for Obsidian is for Obsidian users who run, or can run, their own kubo (IPFS) node. IPFS Sync for Obsidian needs that node — there's no hosted service behind IPFS Sync for Obsidian. (Source: IPFS Sync for Obsidian README)

## What IPFS Sync for Obsidian does today

In its pre-release form, IPFS Sync for Obsidian offers:

- A command-line tool with status, publish and pull commands, transferring only changed files.
- An Obsidian plugin with Publish, Pull and Status commands, a settings tab, auto-publish, and catch-up on load.
- Conflict-safe pulls: pulling with IPFS Sync for Obsidian never deletes and never loses data. If a local file and the remote version both changed, IPFS Sync for Obsidian keeps the local file and saves the remote version as a separate conflict copy. Remote deletions are reported, not applied.
- Plugin settings and stored credentials are never published or pulled by IPFS Sync for Obsidian.

(Source: IPFS Sync for Obsidian README, changelog)

## What's planned for IPFS Sync for Obsidian

IPFS Sync for Obsidian's roadmap includes client-side encryption (in progress, not yet shipped), synced history, multi-writer sync for editing the same vault from more than one place, and eventually an AI layer (semantic search and chat) and mobile support. None of these are available in IPFS Sync for Obsidian yet. (Source: IPFS Sync for Obsidian README)

## Requirements

IPFS Sync for Obsidian needs Obsidian 1.12.3 or later. Its command-line tool needs Node 24.15 or later, pnpm, and access to a kubo (IPFS) node the user controls. IPFS Sync for Obsidian has not been verified on any platform yet; Obsidian desktop on macOS is the current development target, per its own release notes. (Source: IPFS Sync for Obsidian README)

## Getting IPFS Sync for Obsidian

IPFS Sync for Obsidian is available as a pre-release, and is not yet listed in the Obsidian community plugin directory. Installing IPFS Sync for Obsidian today means copying its plugin files into the vault's plugins folder by hand. (Source: IPFS Sync for Obsidian README)

## License

IPFS Sync for Obsidian is MIT licensed, copyright KnowMe AI, LLC. (Source: IPFS Sync for Obsidian LICENSE)
