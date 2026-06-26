import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { codeMd5, type Block } from '../src/extract.js';
import {
  blockPrefix,
  generateAppdFixtures,
  renderBlockFile,
  renderManifest,
} from '../src/fixtures.js';

function block(page: string, code: string, order: string[], skip = false): Block {
  return { page, code, order, skip, md5: codeMd5(code) };
}

describe('blockPrefix', () => {
  // Regression: md5 hashes routinely start with a digit, but Python
  // identifiers can't. The prefix MUST begin with a letter or every
  // generated fixture is a SyntaxError, which in turn crashes the DH
  // server during app.d evaluation.
  it('always starts with a letter', () => {
    for (const md5 of [
      '00343a16f0d2ab66ebe4b87f531d2343',
      '9b7f78980cffde4bb7542b637b1f76ec',
      'f000000000000000000000000000000a',
    ]) {
      const p = blockPrefix(md5);
      expect(p).toMatch(/^[A-Za-z][A-Za-z0-9_]*$/);
      // And it must be deterministic — same md5 → same prefix.
      expect(blockPrefix(md5)).toBe(p);
    }
  });
});

describe('renderBlockFile', () => {
  it('wraps code in an isolated function and hoists order= names with md5 prefix', () => {
    const b = block('candlestick.md', 'primary = 42\nignored = 99', ['primary']);
    const out = renderBlockFile(b, b.page);
    const p = blockPrefix(b.md5); // exported-global prefix (e.g. b1234abcd)
    const md5_8 = b.md5.slice(0, 8); // private function-name suffix

    // Header includes source page + md5 + order list.
    expect(out).toContain(`# Source: docs/candlestick.md`);
    expect(out).toContain(`# Block md5: ${b.md5}`);
    expect(out).toContain(`# order=primary`);
    // Function carrying isolated locals. Private name uses the raw 8-hex
    // since the leading underscore already makes it a valid identifier.
    expect(out).toContain(`def _block_${md5_8}():`);
    expect(out).toContain(`    primary = 42`);
    expect(out).toContain(`    ignored = 99`);
    expect(out).toContain(`    return locals()`);
    // Hoist line uses the mangled GLOBAL name (must start with a letter).
    expect(out).toContain(`${p}_primary = _block_${md5_8}_locals["primary"]`);
    // Only `order=` names are hoisted; `ignored` is NOT.
    expect(out).not.toMatch(new RegExp(`^${p}_ignored\\s*=`, 'm'));
  });

  it('only hoists declared order= names', () => {
    const b = block('demo.md', 'a = 1\nb = 2\nc = 3', ['a', 'c']);
    const out = renderBlockFile(b, b.page);
    const p = blockPrefix(b.md5);
    const md5_8 = b.md5.slice(0, 8);
    expect(out).toContain(`${p}_a = _block_${md5_8}_locals["a"]`);
    expect(out).toContain(`${p}_c = _block_${md5_8}_locals["c"]`);
    expect(out).not.toContain(`${p}_b =`);
  });
});

describe('renderManifest', () => {
  it('emits one file_N= entry per block file', () => {
    const m = renderManifest(['block_aaa.py', 'block_bbb.py']);
    expect(m).toContain('type=script');
    expect(m).toContain('scriptType=python');
    expect(m).toContain('enabled=true');
    expect(m).toContain('id=docs.examples');
    expect(m).toContain('name=Docs Examples');
    expect(m).toContain('file_0=block_aaa.py');
    expect(m).toContain('file_1=block_bbb.py');
  });
});

describe('generateAppdFixtures', () => {
  it('writes one block_<md5>.py per non-skip block, plus tests.app, plus a prefix map', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tvl-fix-'));

    // Two blocks on different pages reusing the SAME variable name `primary`.
    const b1 = block('a.md', 'primary = 1', ['primary']);
    const b2 = block('b.md', 'primary = 2', ['primary']);
    const bSkip = block('c.md', 'should_not_exist = 3', ['should_not_exist'], true);

    const res = generateAppdFixtures([b1, b2, bSkip], dir);

    expect(res.blockCount).toBe(2);
    expect(res.prefixMap.size).toBe(2);
    expect(res.prefixMap.get(b1.md5)).toBe(blockPrefix(b1.md5));
    expect(res.prefixMap.get(b2.md5)).toBe(blockPrefix(b2.md5));

    // Files on disk.
    const files = readdirSync(dir).sort();
    expect(files).toContain(`block_${b1.md5}.py`);
    expect(files).toContain(`block_${b2.md5}.py`);
    expect(files).toContain('tests.app');
    // Skipped block has no file.
    expect(files.find(f => f.includes(bSkip.md5))).toBeUndefined();

    // Each file should hoist its mangled symbol.
    const f1 = readFileSync(join(dir, `block_${b1.md5}.py`), 'utf8');
    const f2 = readFileSync(join(dir, `block_${b2.md5}.py`), 'utf8');
    expect(f1).toContain(`${blockPrefix(b1.md5)}_primary`);
    expect(f2).toContain(`${blockPrefix(b2.md5)}_primary`);
    // The two prefixes differ so the duplicate `primary` doesn't collide.
    expect(blockPrefix(b1.md5)).not.toBe(blockPrefix(b2.md5));

    // Manifest lists both blocks.
    const manifest = readFileSync(res.manifestPath, 'utf8');
    expect(manifest).toContain(`block_${b1.md5}.py`);
    expect(manifest).toContain(`block_${b2.md5}.py`);
  });

  it('cleans up stale block_*.py from previous runs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tvl-fix-stale-'));
    const oldBlock = block('old.md', 'gone = 1', ['gone']);
    generateAppdFixtures([oldBlock], dir);
    expect(existsSync(join(dir, `block_${oldBlock.md5}.py`))).toBe(true);

    // Second run: different blocks. Old file should be removed.
    const newBlock = block('new.md', 'kept = 1', ['kept']);
    generateAppdFixtures([newBlock], dir);
    expect(existsSync(join(dir, `block_${oldBlock.md5}.py`))).toBe(false);
    expect(existsSync(join(dir, `block_${newBlock.md5}.py`))).toBe(true);
  });

  it('dedupes blocks with identical md5 (same code reused verbatim)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tvl-fix-dup-'));
    const b1 = block('a.md', 'shared = 1', ['shared']);
    const b2 = block('b.md', 'shared = 1', ['shared']); // identical code → same md5
    expect(b1.md5).toBe(b2.md5);
    const res = generateAppdFixtures([b1, b2], dir);
    expect(res.blockCount).toBe(1);
    expect(res.prefixMap.size).toBe(1);
  });
});
