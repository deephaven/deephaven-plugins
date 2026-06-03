import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { codeMd5, extractBlocks, walkDocs } from '../src/extract.js';

describe('codeMd5', () => {
  it('is stable for a known input', () => {
    // md5("x = 1-python") computed once and pinned. This MUST NOT change
    // without coordinating with salmon (see extract.ts contract block).
    expect(codeMd5('x = 1')).toBe('de0ffed875c44f394a3ab83febe157a1');
  });

  it('ignores surrounding whitespace', () => {
    expect(codeMd5('  x = 1\n')).toBe(codeMd5('x = 1'));
  });
});

describe('extractBlocks', () => {
  it('parses an order=a,b block', () => {
    const md = [
      'Some prose.',
      '',
      '```python order=foo,bar',
      'foo = tvl.line(t, time="t", value="v")',
      'bar = tvl.candlestick(t, time="t", open="o", high="h", low="l", close="c")',
      '```',
      '',
      'Trailing prose.',
    ].join('\n');

    const blocks = extractBlocks('demo.md', md);
    expect(blocks).toHaveLength(1);
    const b = blocks[0];
    expect(b.page).toBe('demo.md');
    expect(b.order).toEqual(['foo', 'bar']);
    expect(b.skip).toBe(false);
    expect(b.md5).toBe(codeMd5(b.code));
  });

  it('skips a block whose first line is `# no-snapshot`', () => {
    const md = [
      '```python order=helper',
      '# no-snapshot',
      'helper = tvl.line(t, time="t", value="v")',
      '```',
    ].join('\n');
    const blocks = extractBlocks('demo.md', md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].skip).toBe(true);
  });

  it('honors a `skip` flag in the info string', () => {
    const md = ['```python skip', 'x = 1', '```'].join('\n');
    const blocks = extractBlocks('demo.md', md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].skip).toBe(true);
  });

  it('ignores non-python fences', () => {
    const md = ['```js', 'console.log("hi");', '```'].join('\n');
    expect(extractBlocks('demo.md', md)).toHaveLength(0);
  });

  it('finds fences indented under a list item', () => {
    // Regression test: the prior regex-based parser required column-0
    // backticks and silently skipped fences nested in list items, which
    // caused README.md's quickstart block to be invisible to Pass 2.
    const md = [
      '1. Install with pip:',
      '',
      '   ```bash',
      '   pip install thing',
      '   ```',
      '',
      '2. Then run the example:',
      '',
      '   ```python order=chart',
      '   chart = tvl.line(t, timestamp="t", value="v")',
      '   ```',
    ].join('\n');
    const blocks = extractBlocks('readme.md', md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].order).toEqual(['chart']);
    expect(blocks[0].code).toBe('chart = tvl.line(t, timestamp="t", value="v")');
  });

  it('produces stable md5 hashes for a column-0 fence (salmon-contract guard)', () => {
    // The exact code body must produce the same hash that salmon's Pass 1
    // computes on the same block. Drift here = misaligned envelope files.
    const md = ['```python order=foo', 'foo = 1', '```'].join('\n');
    const [block] = extractBlocks('demo.md', md);
    expect(block.code).toBe('foo = 1');
    expect(block.md5).toBe(codeMd5('foo = 1'));
  });
});

describe('walkDocs', () => {
  it('discovers blocks across files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tvl-snap-test-'));
    mkdirSync(join(dir, 'sub'), { recursive: true });
    writeFileSync(
      join(dir, 'a.md'),
      '```python order=alpha\nalpha = tvl.line(t, time="t", value="v")\n```\n'
    );
    writeFileSync(
      join(dir, 'sub', 'b.md'),
      '```python order=beta\n# no-snapshot\nbeta = "skipme"\n```\n```python order=gamma\ngamma = tvl.area(t, time="t", value="v")\n```\n'
    );
    const blocks = walkDocs(dir);
    const byName = new Map(blocks.map(b => [b.order[0], b]));
    expect(byName.get('alpha')?.skip).toBe(false);
    expect(byName.get('beta')?.skip).toBe(true);
    expect(byName.get('gamma')?.skip).toBe(false);
    expect(blocks).toHaveLength(3);
  });
});
