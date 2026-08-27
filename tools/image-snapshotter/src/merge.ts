/**
 * Read / merge / write snapshot JSON envelopes.
 *
 * Envelope shape (kept stable so salmon Pass 1 and Pass 2 can co-author):
 *
 *   {
 *     "file": "<docs page filename>",
 *     "objects": {
 *       "<variable_name>": { "type": "<fqn>", "data": ... }
 *     }
 *   }
 *
 * Pass 1 (salmon, tables) and Pass 2 (this tool, charts) both write into the
 * same `<code_md5>.json` file. The merge is additive: writing an `objects`
 * key never overwrites an existing one set by salmon (tables); chart entries
 * land alongside.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export interface SnapshotObject {
  type: string;
  data: unknown;
}

export interface SnapshotEnvelope {
  file: string;
  objects: Record<string, SnapshotObject>;
}

/**
 * Load `path` if it exists; otherwise return a fresh envelope for `page`.
 * Salmon-authored keys (`file`, `objects.*`) are preserved verbatim.
 */
export function readOrInit(path: string, page: string): SnapshotEnvelope {
  if (!existsSync(path)) {
    return { file: page, objects: {} };
  }
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw) as Partial<SnapshotEnvelope>;
  const env: SnapshotEnvelope = {
    file: typeof parsed.file === 'string' ? parsed.file : page,
    objects: parsed.objects && typeof parsed.objects === 'object' ? { ...parsed.objects } : {},
  };
  return env;
}

/**
 * Write `env` to `path` atomically (tmp file + rename) so that a half-written
 * JSON can never poison the repo state. Pretty-prints with stable key order.
 */
export function writeAtomic(path: string, env: SnapshotEnvelope): void {
  mkdirSync(dirname(path), { recursive: true });
  const stable = stableEnvelope(env);
  const body = JSON.stringify(stable, null, 2) + '\n';
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, body, 'utf8');
  renameSync(tmp, path);
}

/** Sort `objects` keys so the diff stays stable across runs. */
function stableEnvelope(env: SnapshotEnvelope): SnapshotEnvelope {
  const names = Object.keys(env.objects).sort();
  const objects: Record<string, SnapshotObject> = {};
  for (const n of names) objects[n] = env.objects[n];
  return { file: env.file, objects };
}
