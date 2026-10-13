# Where the evidence screenshots are

The documents in this directory (README files, measurement JSON, the integration gate and the design critique) are on `main`. The screenshots they cite are not, to keep about 20 MB of PNG out of the repository. They are on these branches of `Know-Me-Tools/charcoal-agent`, under the same `evidence/<directory>/` path:

| Directory | Branch | What it shows |
|---|---|---|
| `09-live-captures/` | `qa/live-captures` | The live site before the design fixes: landing, empty thread, answered thread, About panel, streaming step, at 320/768/1024/1440 in both themes. |
| `11-live-captures-after/` | `qa/live-captures-after` | The live site after PR #70, with DOM measurements. |
| `12-live-captures-after-71/` | `qa/live-captures-after` | The live site after PR #71 (sidebar after reloads, the gap above the composer, scroll arrow, tab bar, empty-thread heading). |

`10-design-critique.md` is also on `qa/design-critique` and cites images from `09-live-captures/`. `08-integration-gate.md` is on `qa/integration-gate`.

If a branch is deleted the images are gone; the measurements and verdicts in the documents remain.
