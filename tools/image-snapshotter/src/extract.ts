/**
 * Code-block walker for docs/*.md.
 *
 * --------------------------------------------------------------------------
 *  md5 ALGORITHM CONTRACT
 *
 *  Block hash = md5( code.trim() + "-python" ), hex digest, lowercase.
 *
 *  This MUST stay byte-for-byte aligned with salmon's per-block hash so that
 *  Pass 1 (salmon, tables) and Pass 2 (this tool, charts) write into the
 *  same `<md5>.json` envelopes. The salmon-changes plan requires salmon to
 *  match this exact algorithm; if it ever changes here, that plan must be
 *  updated and salmon's snapshotter re-aligned in lockstep.
 * --------------------------------------------------------------------------
 *
 * The fence walker is backed by a real CommonMark parser
 * (`mdast-util-from-markdown`) so it sees fences the same way the docs site
 * eventually does. Earlier revisions used a column-0 regex which silently
 * skipped fences indented under a list item — a quiet correctness bug that
 * cost an afternoon of debugging on README.md's quickstart.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Code, Root, RootContent } from 'mdast';

/** Stable across runs and across hosts. See contract block above. */
export function codeMd5(code: string): string {
  const normalized = code.trim() + '-python';
  return createHash('md5').update(normalized, 'utf8').digest('hex').toLowerCase();
}

export interface Block {
  /** Page filename, e.g. `"candlestick.md"`. */
  page: string;
  /** Raw code body (no fence lines). */
  code: string;
  /** Variable names to capture from this block, parsed from `order=a,b,c`. */
  order: string[];
  /** True if the block opts out of snapshotting. */
  skip: boolean;
  /** Hex md5 of `code.trim() + "-python"`. */
  md5: string;
}

/**
 * Parse a fence info string of the form `order=a,b,c skip-test foo=bar`. The
 * `lang` token (e.g. `python`) has already been stripped by the parser and
 * lives in `node.lang`; what arrives here is the `meta` field, which is the
 * trailing portion of the info string.
 */
function parseMeta(meta: string | null | undefined): {
  order: string[];
  skipFlag: boolean;
} {
  if (!meta) return { order: [], skipFlag: false };
  const tokens = meta
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);
  let order: string[] = [];
  let skipFlag = false;
  for (const tok of tokens) {
    if (tok === 'skip-test' || tok === 'no-snapshot') {
      skipFlag = true;
    } else if (tok.startsWith('order=')) {
      order = tok
        .slice('order='.length)
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
  }
  return { order, skipFlag };
}

/**
 * Yield every `code` node in `tree` (any depth), including ones nested
 * inside list items / block quotes / etc.
 */
function* iterCodeNodes(tree: Root | RootContent): Generator<Code> {
  if (tree.type === 'code') {
    yield tree;
    return;
  }
  if ('children' in tree && Array.isArray(tree.children)) {
    for (const child of tree.children) {
      yield* iterCodeNodes(child as RootContent);
    }
  }
}

/** Pull blocks out of a single markdown file. */
export function extractBlocks(page: string, source: string): Block[] {
  const tree = fromMarkdown(source);
  const blocks: Block[] = [];
  for (const node of iterCodeNodes(tree)) {
    const lang = (node.lang ?? '').toLowerCase();
    if (lang !== 'python' && lang !== 'py') continue;
    const code = node.value ?? '';
    const { order, skipFlag } = parseMeta(node.meta);
    const firstLine = code.split('\n', 1)[0]?.trim() ?? '';
    const skipComment = firstLine === '# no-snapshot';
    blocks.push({
      page,
      code,
      order,
      skip: skipFlag || skipComment,
      md5: codeMd5(code),
    });
  }
  return blocks;
}

/** Recursively walk `docsDir` for `.md` files and return every block found. */
export function walkDocs(docsDir: string): Block[] {
  const blocks: Block[] = [];
  const stack: string[] = [docsDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        // Skip build output and asset dumps.
        if (name === 'build' || name === '_assets' || name === 'snapshots') continue;
        stack.push(full);
        continue;
      }
      if (!name.endsWith('.md')) continue;
      const src = readFileSync(full, 'utf8');
      for (const b of extractBlocks(basename(full), src)) blocks.push(b);
    }
  }
  return blocks;
}
