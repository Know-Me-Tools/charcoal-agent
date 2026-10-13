# How BossFang works

## The BossFang daemon and dashboard

BossFang runs as a local daemon with an HTTP and WebSocket API, by default at `http://127.0.0.1:4545`, and a web dashboard for managing agents. Its configuration lives in a TOML file in the user's home directory.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.

## Where BossFang keeps data

By default BossFang stores its operational data in SurrealDB, either embedded on disk or on a remote SurrealDB server. Operational data and memory are kept in separate databases. Changes to the database layout are applied as numbered migrations, and BossFang checks that applied migrations have not been altered, although the ledger notes that this drift check itself has no test yet.

Source: BossFang feature ledger, retrieved 2026-10-13.

## How BossFang remembers

BossFang's memory layer is built on the Surreal Memory Server library with an embedded database, so memory works without a separate database service.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.

## How BossFang reaches the Universal Agent Runtime

As implemented in source, not yet built or tested, an owner selects an existing Universal Agent Runtime instance in BossFang and connects to it with a scoped credential. BossFang reads the runtime's model list and can send a no-effect diagnostic run to check the connection. A run that has started stays with its original runtime instance even if the owner later selects another, and only a run the runtime reports as completed counts as completed. Credentials are held in memory for the process and are not saved to disk.

Source: BossFang connects to UAR, retrieved 2026-10-13.
