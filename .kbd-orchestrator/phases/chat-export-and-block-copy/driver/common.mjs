// Shared parts of the Kimi Code task driver for phase chat-export-and-block-copy.
// Adapted from the Kubo driver (agent-backend-settings, /Users/gqadonis/Projects/references/kubo):
// kimi-acp.mjs is an ACP client that gates each tool call before it runs.
// Differences from Kubo: Kimi works in a git worktree (cwd), while the KBD
// runtime, openspec changes and the plan live in the main checkout (ROOT) and
// kbd-apply runs there; PATH gets ~/.kimi-code/bin because `kimi` is not on the
// default PATH; extra forbidden rules for this repo (kill switch, deploys).

import { spawnSync } from 'node:child_process';
import { appendFileSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ROOT is the main checkout: KBD state, openspec changes, the plan and the role profiles.
export const ROOT = '/Users/gqadonis/Projects/know-me/charcoal-agent';
export const KUBO = ROOT; // kept so the copied driver code reads the same
export const PHASE = 'chat-export-and-block-copy';
export const PLAN = `${ROOT}/.kbd-orchestrator/phases/${PHASE}/plan.md`;
export const PHASE_DIR = `${ROOT}/.kbd-orchestrator/phases/${PHASE}`;
export const MODEL = 'kimi-code/k3';
export const DEFAULT_TIMEOUT_S = 3600;
export const LOG_DIR = join(dirname(fileURLToPath(import.meta.url)), 'logs');

// Outward or privileged actions a builder session must never take (plan W2).
// Cluster tools match only in command position: a path such as helm-values/
// in a read-only grep is not a helm call (lke-origin-isolation 1.2, 2026-10-13).
export const FORBIDDEN = [
  { name: 'git push', re: /\bgit\b[^|;&]*\bpush\b/ },
  { name: 'git remote/credential change', re: /\bgit\b[^|;&]*\b(remote\s+(add|set-url)|config\b[^|;&]*credential)/ },
  { name: 'gh write', re: /\bgh\s+(pr|issue|release|repo|gist|secret|workflow|label)\b/ },
  { name: 'gh api write', re: /\bgh\s+api\b[^|;&]*(-X\s*|--method\s+)(POST|PUT|PATCH|DELETE)/i },
  { name: 'kubectl', re: /(?:^|[;&|(`"']\s*|\$\(\s*|\b(?:sudo|env|xargs|exec|command|nohup|timeout\s+\S+)\s+)(?:\S*\/)?kubectl(?=\s|$)/m },
  { name: 'argocd', re: /(?:^|[;&|(`"']\s*|\$\(\s*|\b(?:sudo|env|xargs|exec|command|nohup|timeout\s+\S+)\s+)(?:\S*\/)?argocd(?=\s|$)/m },
  { name: 'helm', re: /(?:^|[;&|(`"']\s*|\$\(\s*|\b(?:sudo|env|xargs|exec|command|nohup|timeout\s+\S+)\s+)(?:\S*\/)?helm(?=\s|$)/m },
  { name: 'docker push/login', re: /\bdocker\b[^|;&]*\b(push|login)\b/ },
  { name: 'kimi config change', re: /\.kimi-code\/config\.toml|\.kimi\/config\.toml/ },
  { name: 'recursive force delete', re: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|--recursive\s+--force|--force\s+--recursive)\b/ },
  { name: 'destructive git', re: /\bgit\b[^|;&]*\b(reset\s+--hard|clean\s+-[a-zA-Z]*f|checkout\s+--\s|branch\s+-D|push)\b/ },
  { name: 'publish or release', re: /\b(npm|pnpm|yarn)\s+publish\b|\bcargo\s+publish\b|\bgh\s+workflow\b/ },
  { name: 'kill switch or deploy variable', re: /site-chat-kill-switch|SITE_CHAT_KILL_SWITCH_EXPECTED/ },
  // A file named .env (or .env.local etc.) or a key file; import.meta.env is not one.
  { name: 'secrets and credentials', re: /(?:^|[\s/"'=])\.env(?:\.[A-Za-z0-9_-]+)?(?=$|[\s"';|&)])|\.pem\b|\bKeychain\b|security\s+find-(generic|internet)-password/ },
  {
    name: 'non-loopback mutating curl',
    re: /\bcurl\b(?=[^|;&]*(-X\s*(POST|PUT|PATCH|DELETE)|--data|-d\s|--upload-file|-T\s))(?![^|;&]*(127\.0\.0\.1|localhost|\[::1\]))/i,
  },
];

// forbiddenRules returns the names of the FORBIDDEN rules a command matches.
export function forbiddenRules(cmd) {
  if (!cmd) return [];
  return FORBIDDEN.filter((f) => f.re.test(cmd)).map((f) => f.name);
}

export function usage(tool, msg) {
  console.error(`${tool}: ${msg}`);
  process.exit(2);
}

export function parseArgs(tool, argv, extraFlags = {}) {
  const o = { addDirs: [], timeout: DEFAULT_TIMEOUT_S, cwd: KUBO, kbd: false, dryRun: false, extra: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) usage(tool, `${a} needs a value`);
      return argv[++i];
    };
    if (a === '--change') o.change = next();
    else if (a === '--task') o.task = next();
    else if (a === '--role') o.role = next();
    else if (a === '--cwd') o.cwd = resolve(next());
    else if (a === '--add-dir') o.addDirs.push(resolve(next()));
    else if (a === '--timeout') o.timeout = Number(next());
    else if (a === '--prompt-extra') o.extra = next();
    else if (a === '--kbd') o.kbd = true;
    else if (a === '--dry-run') o.dryRun = true;
    else if (extraFlags[a]) extraFlags[a](o, next);
    else usage(tool, `unknown argument ${a}`);
  }
  if (!o.selfTest && (!o.change || !o.task || !o.role)) usage(tool, '--change, --task and --role are required');
  if (!Number.isFinite(o.timeout) || o.timeout <= 0) usage(tool, '--timeout must be a positive number');
  return o;
}

export function readTasks(tool, change) {
  const f = `${KUBO}/openspec/changes/${change}/tasks.md`;
  if (!existsSync(f)) usage(tool, `no tasks.md for change ${change}`);
  return readFileSync(f, 'utf8')
    .split('\n')
    .map((l) => l.match(/^- \[[ x/]\] (\d+\.\d+) (.*)$/))
    .filter(Boolean)
    .map((m) => ({ id: m[1], title: m[2] }));
}

export function hardenedEnv() {
  const empty = mkdtempSync(join(tmpdir(), 'kimi-task-nocreds-'));
  const env = { ...process.env };
  // `kimi` is installed under ~/.kimi-code/bin and is not on the default PATH.
  env.PATH = `${homedir()}/.kimi-code/bin:${env.PATH ?? ''}`;
  for (const k of ['GH_TOKEN', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GITHUB_ENTERPRISE_TOKEN', 'SSH_AUTH_SOCK']) delete env[k];
  Object.assign(env, {
    GH_CONFIG_DIR: empty,
    KUBECONFIG: '/dev/null',
    DOCKER_CONFIG: empty,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'credential.helper',
    GIT_CONFIG_VALUE_0: '',
    GIT_SSH_COMMAND: 'false',
    GIT_TERMINAL_PROMPT: '0',
  });
  return env;
}

export function remoteRefs(dir) {
  const r = spawnSync('git', ['-C', dir, 'ls-remote', 'origin'], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
  return r.status === 0 ? r.stdout.trim() : null;
}

export function kbdApply(verb, o, idx, total, title) {
  const candidates = [`${homedir()}/.kimi-code/skills/kbd-apply/kbd-apply.sh`, `${homedir()}/.claude/skills/kbd-apply/kbd-apply.sh`];
  const apply = candidates.find((p) => existsSync(p));
  if (!apply) return { ok: false, out: 'kbd-apply.sh not found' };
  const r = spawnSync('bash', [apply, verb, o.change, o.task, String(idx), String(total), title], {
    cwd: KUBO, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

// beginTask opens the task boundary. A task whose start is already recorded
// (an earlier session timed out or was rejected before end-task) is resumed,
// not refused: the runtime keeps one open start receipt per task.
export function beginTask(o, idx, total, title) {
  const b = kbdApply('begin-task', o, idx, total, title);
  if (b.ok) return { ok: true, resumed: false, out: b.out };
  if (/already has an outstanding start receipt/.test(b.out)) return { ok: true, resumed: true, out: b.out };
  return { ok: false, resumed: false, out: b.out };
}

export function buildPrompt(o, title) {
  return [
    `You are the ${o.role} role of the knowme-site team, executing one KBD task.`,
    `Phase ${PHASE}. Read-only copies of the phase documents are in .kbd-context/ in your working directory (git-ignored; do not edit them): plan.md (read the change list, the iOS findings, the mobile download design, and the row for this task in "Task model assignments"), assessment.md, prior-context.md, execution.md, and change/ (this change's proposal.md and tasks.md).`,
    `Specification: docs/specs/chat-export-okf-and-block-copy.md in your working directory.`,
    `Change: ${o.change}. Task ${o.task}: ${title}`,
    `Your working directory is a git worktree on a feature branch. Edit and commit only there. Read AGENTS.md and CLAUDE.md first. Do only this task and meet its acceptance check.`,
    `Edit only paths your role profile lists as owned; if the task needs another path, end your turn with QUESTION: and say which.`,
    `Commit your work locally in the worktree with a conventional message (type: description). Do not push, tag, merge or open pull requests; the lead does that.`,
    `Do not run git push, gh, kubectl, argocd, helm, docker push or remote mutating requests; do not publish, deploy or touch .github/workflows. Never touch the chat kill switch or the SITE_CHAT_KILL_SWITCH_EXPECTED variable.`,
    `Do not tick checkboxes in tasks.md and do not edit anything under .kbd-context/, .kbd-orchestrator/ or openspec/; the driver records task state.`,
    `Verification boundary: finish the whole task first. No per-edit test loops. A narrow type check (npx tsc --noEmit -p tsconfig.app.json) is allowed to unblock yourself. Use Node 24 (put /Users/gqadonis/.nvm/versions/node/v24.21.0/bin first on PATH); Node 26 breaks vitest. Run the task's own acceptance check once at the end.`,
    `Constraints: client-side-only export; no secrets, internal ids or reasoning text in any export; verify any new dependency from the registry before adding it and never edit versions.toml; use shadcn components, tokens (no raw colours), and the existing KnowMe conventions; every merged client change deploys to production at once, so correctness over speed.`,
    `Shell: run long commands under timeout with stdin closed; no large here-documents (write files with the editor tool); never pkill; never rm -rf.`,
    o.extra,
    `Finish with: changed files, commands run with their real output, the acceptance result (a section titled "Acceptance result" saying Met or Not met), and anything unverified.`,
  ].filter(Boolean).join('\n');
}

// The prompt asks for an "Acceptance result" section (sessions also title it
// "Acceptance check"); a verdict of not met, blocked or partially met in the
// last such section keeps the task open.
// Checked against all 20 session logs of 2026-10-13: only
// mcp-agui-a2ui-registry 1.1 matches.
export function acceptanceNotMet(text) {
  const t = text ?? '';
  const i = t.search(/acceptance (?:result|check)[^\n]*$(?![\s\S]*acceptance (?:result|check))/im);
  if (i < 0) return false;
  const section = t.slice(i, i + 500).split(/\n#{1,4} /)[0];
  return /\bnot met\b|\bpartially met\b|\bunmet\b|\*\*\s*blocked|^\W*blocked\b/im.test(section);
}

// Paths a builder session may never change (operator-only or managed): the
// post-session diff check rejects the task if any of these changed.
export const PROTECTED_PATHS = [/^\.github\//, /^versions\.toml$/, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^\.kbd-orchestrator\//, /^openspec\//, /^k8s\//, /^\.claude\/settings/];

// protectedChanges lists changed or committed files in the worktree that match PROTECTED_PATHS.
export function protectedChanges(dir, base = 'origin/main') {
  const run = (args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
  const committed = run(['diff', '--name-only', `${base}...HEAD`]).stdout.split('\n');
  const working = run(['status', '--porcelain']).stdout.split('\n').map((l) => l.slice(3));
  return [...new Set([...committed, ...working].map((f) => f.trim()).filter(Boolean))].filter((f) => PROTECTED_PATHS.some((re) => re.test(f)));
}

// prepareContext copies the read-only phase documents into <cwd>/.kbd-context/
// and git-excludes that folder, so the builder reads the plan without write
// access to the main checkout's KBD state.
export function prepareContext(o) {
  const dst = join(o.cwd, '.kbd-context');
  mkdirSync(join(dst, 'change'), { recursive: true });
  for (const f of ['plan.md', 'assessment.md', 'prior-context.md', 'execution.md']) {
    const src = `${PHASE_DIR}/${f}`;
    if (existsSync(src)) copyFileSync(src, join(dst, f));
  }
  const changeDir = `${ROOT}/openspec/changes/${o.change}`;
  if (existsSync(changeDir)) cpSync(changeDir, join(dst, 'change'), { recursive: true });
  const ex = spawnSync('git', ['-C', o.cwd, 'rev-parse', '--git-path', 'info/exclude'], { encoding: 'utf8' }).stdout.trim();
  if (ex) {
    const p = resolve(o.cwd, ex);
    mkdirSync(dirname(p), { recursive: true });
    const cur = existsSync(p) ? readFileSync(p, 'utf8') : '';
    if (!cur.split('\n').includes('.kbd-context/')) appendFileSync(p, `${cur.endsWith('\n') || cur === '' ? '' : '\n'}.kbd-context/\n`);
  }
}
