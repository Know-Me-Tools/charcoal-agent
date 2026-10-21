# Goals

- CI gates the server crate: a workflow step that runs cargo clippy --all-targets with warnings denied and the server tests with KNOWME_WEB_DIST_DIR set to the fixture dir, on the Rust version pinned in versions.toml, so a red server lint or test blocks the deploy
- The reset notice's close control is a 44 px target in the KnowMe tokens, and the cause of the one unexplained db-reset-notice e2e flake is found and fixed or recorded as not reproducible
- The two new visitor strings (export omission line, reset notice) and the export flow are looked at on a real phone, the two new e2e specs run in WebKit and Firefox, and the remote-image export case is covered on the built bundle
