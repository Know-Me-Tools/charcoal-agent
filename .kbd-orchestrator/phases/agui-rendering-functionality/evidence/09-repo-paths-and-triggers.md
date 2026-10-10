# Repo paths and workflow triggers (read 2026-10-09)

## `uar/agents/` is tracked in THIS repo, not the UAR reference checkout

`git ls-files uar/agents` in `/Users/gqadonis/Projects/know-me/charcoal-agent`:

```
uar/agents/README.md
uar/agents/knowme-site.json
```

The UAR reference checkout registered in `.kbd-orchestrator/project.json` (`write_access: false`) is a different absolute path, `/Users/gqadonis/Projects/prometheus/universal-agent-runtime`. `uar/agents/` holds agent definitions authored here and seeded into UAR by `scripts/seed-site-agent.sh`.

Registered workspace folders (role, path):

```
focus     /Users/gqadonis/Projects/know-me/charcoal-agent
reference /Users/gqadonis/Projects/prometheus/universal-agent-runtime
reference /Users/gqadonis/Projects/travisjames/skills/artifact-refiner
reference /Users/gqadonis/Projects/references/openfang
ignore    /Users/gqadonis/Projects/cherry-studio
```

## Workflow triggers in `.kbd-orchestrator/constraints.md` (lines 113-122)

```
workflow_triggers:
  - event: on_iteration_complete   -> npm run build
  - event: on_change_complete      -> npm test && npm run lint
```

## Judge script location

`~/.claude/skills/adversarial-review/scripts/dispatch-judge.sh` exists (18,791 bytes) and produced the two reviews of the assessment this session. It is outside this repo, so a repo-relative check reports it missing.
