# Operator runbooks

- `web-search-activation.md`: turning web search on in production.
- Pre-merge check of the concierge prompts: this file, below.

## Pre-merge check of the concierge prompts

Why. `site.yml` reseeds `knowme-site` and `knowme-site-web` on every push to main. A merged prompt change is live to visitors at once, and nobody has chatted with the new prompts before that. This check puts the prompts on two throwaway agents, runs ten visitor scenarios against the real model, and tells you what failed before you merge.

The uncomfortable part. The assertions are regular expressions and a knowledge-base lookup. They catch the failures that have a recognisable shape (a price, a package name that is not in the knowledge base, an unmarked competitor claim, a leaked prompt). They do not judge whether an answer is good. A pass means no known failure shape, not a good answer. Read the transcripts.

### Run it

You need `kubectl` access to the `know-me` cluster (the script reads Secret `site-gate-client` and opens a port-forward to `svc/uar`), plus `node`, `jq` and `curl`.

```sh
# Test the prompts on PR #165 (read from origin/feat/concierge-agent-prompt, read-only):
scripts/ops/check-candidate-agent.sh --context know-me

# After #165 is merged, or for any other branch you have checked out:
AGENT_FILE=uar/agents/knowme-site.json WEB_AGENT_FILE=uar/agents/knowme-site-web.json \
  scripts/ops/check-candidate-agent.sh --context know-me

# One or two scenarios; a plan without sending anything; delete leftover candidates:
scripts/ops/check-candidate-agent.sh --context know-me --only soc2,sample-code
scripts/ops/check-candidate-agent.sh --context know-me --dry-run
scripts/ops/check-candidate-agent.sh --context know-me --cleanup-only
```

It makes about 11 real LLM calls (every scenario against the default candidate, most also against the web candidate) and one tool search for the web comparison. It waits up to 5 minutes for UAR to be ready.

### What it touches

- Writes and deletes only `knowme-site-candidate` and `knowme-site-web-candidate`. These ids are constants in the script, checked before every write; the production ids are rewritten away in a temp copy of the agent files.
- Does not run `seed-site-agent.sh`, so it never writes the presentation templates or the knowledge base. The candidates read the production knowledge base `knowme-site`.
- Reads only Secret `site-gate-client`, for one token request. No credential is printed, logged, put on a command line or written to the transcripts.
- Does not touch ConfigMap `site-chat-kill-switch` or the repo variable `SITE_CHAT_KILL_SWITCH_EXPECTED`.
- Chats go straight to UAR, so they skip the site server's rate limit, spend meter and artifact filter. Request fields match what the site server forwards (`server/src/domain/chat_request.rs`).
- Cleanup: on exit the script sends `DELETE /api/agents/<id>` for both candidates. That route is not confirmed against UAR in this repo. If the log says `could NOT delete`, the candidates stay registered but inert (the site routes only to its configured ids). Delete them with UAR admin tooling, or retry with `--cleanup-only`.

### Read the results

The script prints a table and writes `logs/candidate-eval/<UTC timestamp>/` (gitignored): `summary.txt`, `summary.json` and one `transcripts/<scenario>.<agent>.json` per run with the prompt, the reply, the events seen and every assertion result.

| Result | Meaning | Exit |
|---|---|---|
| PASS | Every assertion held. | 0 |
| CRITICAL FAIL | A critical-fail criterion was hit (an invented fact, a leaked prompt, a price, an unmarked competitor claim, a harmful answer, a length limit). Do not merge. | 1 |
| FAIL | A pass criterion was missed (no clarifying question, no `Next step:` line). Fix the prompt or accept it knowingly. | 2 |
| ERROR | The run did not finish (non-2xx, no `agui.done`, an `agui.error`, a timeout). Not a verdict on the prompt: fix the cause and rerun that scenario with `--only`. | 3 |

A critical fail that you believe is a false positive: open the transcript, read the `detail` on the failed assertion, and decide. If the assertion is wrong, fix it in `docs/knowledge-source/eval/concierge-scenarios.json` in its own change, not by skipping it.

Before merging, also read at least these transcripts by eye: `clinic-with-notes`, `sample-code`, `compare-mem0-langgraph-web`, `roi-20-staff`. They are the ones a regex judges worst.

### Scenarios

`docs/knowledge-source/eval/concierge-scenarios.json` holds ten visitor scenarios (the Mem0 and LangGraph comparison runs twice, once per agent), each with `pass` and `critical_fail` criteria in words and the assertions that implement them. A `global_assertions` block applies to every run: at most 250 words and 40 lines of prose, at most 60 lines of code, no prompt leak, no exclamation marks, no hype words. To add a scenario, add an entry and use the assertion types listed under `assertion_types` in that file.

The `identifiers_in_kb` and `phrases_in_kb` checks compare against the text of `content/knowledge` and `docs/knowledge-source`. A name that is real but only in the live knowledge base and not in those folders will fail; ingest or add it before trusting the result.

### Not covered

It does not test the site server's guards, the a2ui card rendering, or multi-turn conversations (the site sends one message per request). It tests the prompts as they behave once, on one run; the model is not deterministic, so a scenario that passes once can fail on the next run. Rerun a close call before trusting it.
