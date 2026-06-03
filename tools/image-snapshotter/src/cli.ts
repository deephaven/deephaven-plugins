#!/usr/bin/env node
/**
 * image-snapshotter CLI
 *
 * Pass 2 docs image snapshotter. Plugin-agnostic — the target widget
 * selector, widget type, and fixture app id are read from `SNAPSHOTTER_*`
 * env vars (see docker-entrypoint.sh and docker-compose.docs-snapshots.yml).
 *
 *   image-snapshotter             capture + prune; fail on dirty git
 *   image-snapshotter --update    capture + prune; allow dirty
 *   image-snapshotter --prune-only  only orphan-prune
 *   image-snapshotter --check     same as default (CI mode)
 *
 * Default behavior:
 *   1. Run `npx playwright test` against the spec in `tests/`. The spec
 *      does the actual widget capture + JSON envelope merge.
 *   2. Run orphan-asset pruning.
 *   3. Unless --update was passed, run `git status --porcelain` against
 *      `docs/snapshots/` and exit 1 if anything changed.
 *
 * Paths are resolved relative to SNAPSHOTTER_PLUGIN_ROOT (required) so the
 * tool can be invoked once per plugin from anywhere in the tree.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruneOrphanAssets } from './prune.js';

interface Args {
  update: boolean;
  pruneOnly: boolean;
  check: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { update: false, pruneOnly: false, check: false, help: false };
  for (const v of argv) {
    switch (v) {
      case '--update':
        a.update = true;
        break;
      case '--prune-only':
      case '--prune':
        a.pruneOnly = true;
        break;
      case '--check':
        a.check = true;
        break;
      case '--help':
      case '-h':
        a.help = true;
        break;
      default:
        process.stderr.write(`Unknown argument: ${v}\n`);
        a.help = true;
        break;
    }
  }
  return a;
}

function printHelp(): void {
  const help = `image-snapshotter — Pass 2 docs widget snapshotter

Usage:
  image-snapshotter              Capture + prune; fail on dirty git (CI mode).
  image-snapshotter --update     Capture + prune; do not fail on dirty git.
  image-snapshotter --prune-only Only run orphan-asset pruning.
  image-snapshotter --check      Same as the default (explicit CI mode).
  image-snapshotter --help       Show this message.

Required env:
  SNAPSHOTTER_PLUGIN_ROOT      Plugin root; docs/, docs/snapshots/ live under it.
  SNAPSHOTTER_TARGET_SELECTOR  CSS selector for the widget to screenshot.
  SNAPSHOTTER_WIDGET_TYPE      Widget type string stamped into JSON envelopes.

Optional env:
  SNAPSHOTTER_BASE_URL         IDE URL (default http://localhost:10000/ide/).
  SNAPSHOTTER_APP_ID           Deephaven app.d id (default 'docs.examples').
  SNAPSHOTTER_APP_NAME         Human label for the app.d manifest.

Snapshot envelope format:
  docs/snapshots/<code_md5>.json with
    { "file": "<page>.md", "objects": { "<name>": { "type": "...", "data": ... } } }
  where code_md5 = md5(code.strip() + "-python") (hex, lowercase).
`;
  process.stdout.write(help);
}

function pluginRoot(): string {
  const fromEnv = process.env.SNAPSHOTTER_PLUGIN_ROOT;
  if (fromEnv) return resolve(fromEnv);
  process.stderr.write(
    'image-snapshotter: SNAPSHOTTER_PLUGIN_ROOT is required\n',
  );
  process.exit(2);
}

function runPlaywright(toolDir: string): number {
  const r = spawnSync('npx', ['playwright', 'test'], {
    cwd: toolDir,
    stdio: 'inherit',
    env: process.env,
  });
  return r.status ?? 1;
}

function checkClean(snapshotsDir: string): number {
  const r = spawnSync('git', ['status', '--porcelain', snapshotsDir], {
    stdio: ['inherit', 'pipe', 'inherit'],
    encoding: 'utf8',
  });
  const out = (r.stdout ?? '').trim();
  if (out.length === 0) return 0;
  process.stderr.write(`docs/snapshots/ is dirty:\n${out}\n`);
  process.stderr.write(`Re-run with --update to accept the changes.\n`);
  return 1;
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }

  const root = pluginRoot();
  const toolDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const snapshotsDir = join(root, 'docs', 'snapshots');

  if (!existsSync(snapshotsDir)) {
    process.stderr.write(`Expected snapshots dir at ${snapshotsDir} — bailing.\n`);
    return 1;
  }

  if (!args.pruneOnly) {
    const code = runPlaywright(toolDir);
    if (code !== 0) {
      process.stderr.write(`playwright capture failed (exit ${code}).\n`);
      return code;
    }
  }

  const pruneResult = pruneOrphanAssets(snapshotsDir);
  process.stdout.write(
    `pruned ${pruneResult.deleted.length} orphan asset(s); ` +
      `kept ${pruneResult.kept}, referenced ${pruneResult.referenced}\n`,
  );
  for (const p of pruneResult.deleted) process.stdout.write(`  removed ${p}\n`);

  if (args.pruneOnly) return 0;
  if (args.update) return 0;
  return checkClean(snapshotsDir);
}

const code = main();
process.exit(code);
