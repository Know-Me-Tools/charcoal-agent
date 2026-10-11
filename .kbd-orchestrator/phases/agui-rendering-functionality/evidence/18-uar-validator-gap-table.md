# 18 - UAR A2UI validator gap table (R6, task 1.1)

Sources: UAR `src/uar/a2ui/protocol.rs` (a7cb9729 checkout; the pinned image `688a97e4` is source `bb6ea8ba`, not re-diffed here), official catalog in `node_modules/@a2ui/web_core@0.12.0` `v0_9/basic_catalog/components`.

## Components
| Official v0.9.1 basic catalog (18) | UAR validator (9) |
|---|---|
| Text, Button, TextField, CheckBox, ChoicePicker, Row, Column, Card, Divider | accepted (the same nine; `ChoicePicker` confirmed in `protocol.rs`) |
| AudioPlayer, DateTimeInput, Icon, Image, List, Modal, Slider, Tabs, Video | not accepted |

## Recorded needs against the nine
| Surface | Components used | Gap |
|---|---|---|
| Public answer card (`uar/presentations/answer-card.json`) | Card, Column, Text, Divider | none |
| Client inference (`src/features/a2ui/infer.ts`) | Card, Column, Row, Text | none; arrays of objects render as headed Columns (a `List` would be nicer, not needed) |
| Red team (evidence 17) | the model never needed a component outside the four | none |

No decision, assessment or evidence file records a surface that needs one of the nine missing components. A search of the phase files found none.

## Verdict
No gap. R6 closes with no UAR change and no UAR PR.

- URL-bearing components (Image, Video, AudioPlayer) stay out: they need a recorded URL policy, and none is recorded.
- Unverified: I did not run an unsupported component through the pinned UAR to observe the rejection; the table rests on source.
- Reopen when a concrete surface needs one of the nine, with that surface named.

Stale item noticed, not fixed: `plan.md` CP3 still says to run `bootstrap-site.sh a2ui off`. The switch and that command were removed in #30.
