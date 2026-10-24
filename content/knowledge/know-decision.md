# Know Decision (KnowMe Decision Layer) status and what is stated

Know Decision, also called the KnowMe Decision Layer, is a planned set of local decision models with typed Act, Review and Escalate outcomes, a Rust API and MCP support. The portfolio lists it as pre-implementation: the bundled Julia candidate and native acceptance remain pending. It does not exist as working software yet.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## Know Decision status and version

The portfolio status for Know Decision is "Pre-implementation; bundled Julia candidate and native acceptance remain pending." The repository README says the repository currently holds the design, research and build playbook, and that code starts at milestone M0. Its repository is Know-Me-Tools/know-me-decision. Version line: no tagged release (last commit 2026-09-30).

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Know Decision repository README, retrieved 2026-10-24.

## What Know Decision is stated to do

- Know Decision plans to answer typed questions about a piece of state: choose one of up to 255 options, give an ordinal score, or give an independent probability per statement.
- Each answer carries a separate outcome: Act, Review (a human confirms) or Escalate (a tripwire fired; always logged, and no model can override it).
- Julia 1 is the selected candidate for the bundled default model, and native platform acceptance is pending.
- The README says first launch must work fully offline, and that model availability does not imply calibration.
- The published model checkpoint is about 550.5 MiB before the runtime, which the README calls its uncomfortable deployment cost.

Source: Know Decision repository README, retrieved 2026-10-24.

## How Know Decision relates to other products

The README describes Know Decision as the decision layer shared by KnowMe's products and names no integration that exists. The portfolio treats such relationships as architectural intent, not proof of completed integration.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
