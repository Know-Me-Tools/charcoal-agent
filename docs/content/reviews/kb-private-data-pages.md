# Review record: kb-private-data-pages

Phase `usefulness-update`, child `concierge-brief-fit`, change B2. Author: km-content-creator (AI-drafted). Seven concept pages under `solutions/`, registered in the build manifest, with eight eval questions appended (two critical). The operator approves by merging. Page 6 needs the operator's legal check before merge.

## Pages and status wording
- `private-data-question-answering`: leads with the plain fact that no product turns a plain-language question into a cohort or analytics query, counts patients or records, or reports denominators and missing data. Pieces are tagged shipped, tag only, pattern or not offered.
- `constrained-query-pattern`: marked a design pattern, not a product. Quarry has no read-only mode and its REST surface includes writes, so read-only comes from a database role. A Cedar policy that permits only read tools "can be configured"; none ships.
- `private-deployment-checklist`: localhost default, opt-in `UAR_LOCAL_ONLY=1` (off by default), build features for local embeddings, "about 3 GB" as the deployment guide's own statement, the Helm chart as a starting point (its version labels say 1.0.0 at the v1.3.0 tag).
- `audit-and-provenance`: per-tool-call evidence and approval records without arguments or results; no durable audit log or export endpoint; run events are process-local and bounded; memory history is recorded; the entity history tool is not shown to work; point-in-time graph returns what existed by then; Prometheus Knowledge does not record which snapshot produced an answer.
- `human-review-workflow`: only read-only tools skip approval; MCP tools need approval unless pre-approved; the server's read-only hint is ignored; 300 seconds. Flint Gate and The Boss statements repeat what the existing `run-ai-agents-with-auth-and-audit` and clinic pages already state.
- `regulated-industry-readiness`: see the next section.
- `scope-a-pilot`: one task, ten timed examples, exit criteria; the ROI formulas are linked, not copied.

## Claims that need operator approval
1. **The Google GKE statement (page 6).** The page says the company can run these products in its Google GKE environment and describes that environment as HIPAA compliant, labelled as the company's own statement. It comes from the operator's instruction of 2026-10-26. No repository or other source supports it, and this record has not verified it. It is not written as a certification, a business associate agreement, an audit result or legal advice. **Legal check before merge:** confirm the sentence is acceptable to publish in that form, or strike the section. The validator allows the sentence because "no product repository supports this" precedes the term in it; that is an honest attribution, and it is also the only reason the check passes, so the operator should decide on the wording, not the gate.
2. **"Local-only" and "decentralized" wording (pages 3 and 6).** The page claims only what the source shows: the localhost default and an opt-in mode that is off by default. It does not say a default install makes no outbound connections.
3. **The agent name.** All pages say "KnowMe Concierge", per the operator's decision. Existing pages still say "the KnowMe agent" in places and are not changed here.
4. **Private-repo products.** Locus, demos and htmx-doc-forge are not described on these pages. Flint Infra is excluded by the operator and does not appear.

## Sources
A read-only source check on 2026-10-26: the Universal Agent Runtime at tag v1.3.0 (the cluster's pre-release; the facts file's stable release is v1.2.3), Flint Forge at origin/main, Surreal Memory Server at origin/main and Prometheus Knowledge at origin/main. Source URLs on the pages are the public code files, with the tag for UAR. The portfolio (Edition 2) is cited for status lines, and the existing READMEs for Flint Gate and The Boss.

## Not verified
- Which Cedar policy files, embedder and storage provider a default UAR 1.3.0 image uses.
- Whether tool arguments appear in any log, and whether `rag.retrieval.decision` events are kept durably.
- Quarry's write paths under a read-only database role.
- The "about 3 GB" image size (the deployment guide's statement only).
- Locus, demos and htmx-doc-forge (private repositories, not read).
- UAR is read at the v1.3.0 tag, a pre-release in the facts file. Behaviour in the stable v1.2.3 was not compared.
- Retrieval: the eval needs UAR and has not been run on these pages. It runs through the "Site content sync" workflow after the operator merges.

## Left out
- The two lines in a platform demo and competitive document that use compliance words, because they are not claims about a product.
- Epic, ModMed, OHDSI ATLAS and TriNetX: no source gives any fact about them. The comparison belongs to the web agent, with a marker on every vendor sentence.
- Prices, withheld terms, client names and anything from a prospect's brief.

## Review status
Author self-review only. The content officer's pre-review and the operator's approval are still required. Nothing reaches the concierge until the operator runs the KB sync after merge.

## Revision 2026-10-29: requirement map for pasted briefs
Candidate-check transcripts on `155faf0` (0 of 4 brief runs pass) and a retrieval probe showed that a brief retrieves the later "not offered" and "other ways" chunks of `private-data-question-answering` and not the chunk that names the shipped pieces, so the replies tag nothing (shipped). The page now opens with a map of each requirement in a brief (read-only access, approval before an action, inside the firewall, audit trail, cohort counts and denominators, comparison categories) to the product that provides it and its status. The "not offered" and "other ways" sections were folded into that map; no claim was added or strengthened. One eval question uses a brief-shaped query. The `no-compliance-claim` assertion no longer matches the visitor's own word "audited" in a restatement; it still matches "independently audited", "has been audited" and the other claim forms.

Not verified: that the map changes what a brief retrieves. That needs the KB sync, the retrieval probe and the two brief scenarios re-run after merge.
