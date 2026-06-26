#!/usr/bin/env node
/**
 * Generate per-block app.d fixtures from docs/*.md.
 *
 * Pass 2's docker entrypoint runs this just before starting the test
 * server. The server is then booted with `-Ddeephaven.application.dir`
 * pointing at the output directory, so every docs example is pre-loaded
 * as a panel before Playwright connects.
 *
 * Usage:
 *
 *   image-snapshotter-fixture-gen --docs <docsDir> --out <outDir>
 *
 * Falls back to SNAPSHOTTER_PLUGIN_ROOT/docs when --docs is omitted so
 * the in-container path (where the plugin source isn't laid out the same
 * way) can be configured by env var like the spec already is.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { walkDocs } from './extract.js';
import { generateAppdFixtures } from './fixtures.js';
function parseArgs(argv) {
    const a = { help: false };
    for (let i = 0; i < argv.length; i += 1) {
        const v = argv[i];
        switch (v) {
            case '--docs':
                a.docs = argv[++i];
                break;
            case '--out':
                a.out = argv[++i];
                break;
            case '-h':
            case '--help':
                a.help = true;
                break;
            default:
                process.stderr.write(`Unknown argument: ${v}\n`);
                a.help = true;
        }
    }
    return a;
}
function printHelp() {
    process.stdout.write(`image-snapshotter-fixture-gen — emit per-block app.d fixtures from docs/*.md

Usage:
  image-snapshotter-fixture-gen --docs <docsDir> --out <outDir>

Environment:
  SNAPSHOTTER_PLUGIN_ROOT  Used to derive docsDir when --docs is omitted
                           (docsDir = $SNAPSHOTTER_PLUGIN_ROOT/docs).

Writes:
  <outDir>/block_<md5>.py    one file per non-skip block
  <outDir>/tests.app         Deephaven app.d manifest pointing at all blocks
  <outDir>/prefix-map.json   md5 → 8-char prefix map (consumed by spec)
`);
}
function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return 0;
    }
    let docsDir = args.docs;
    if (!docsDir) {
        const root = process.env.SNAPSHOTTER_PLUGIN_ROOT;
        if (root)
            docsDir = join(root, 'docs');
    }
    if (!docsDir) {
        process.stderr.write('image-snapshotter-fixture-gen: --docs is required (or set SNAPSHOTTER_PLUGIN_ROOT)\n');
        return 2;
    }
    if (!args.out) {
        process.stderr.write('image-snapshotter-fixture-gen: --out is required\n');
        return 2;
    }
    const docsAbs = resolve(docsDir);
    const outAbs = resolve(args.out);
    mkdirSync(outAbs, { recursive: true });
    const blocks = walkDocs(docsAbs);
    const result = generateAppdFixtures(blocks, outAbs);
    // Persist the md5→prefix map so the Playwright spec can mangle names
    // when opening panels. JSON object is enough; the spec re-loads it as
    // Record<string, string>.
    const prefixMap = {};
    for (const [md5, prefix] of result.prefixMap)
        prefixMap[md5] = prefix;
    const prefixMapPath = join(outAbs, 'prefix-map.json');
    writeFileSync(prefixMapPath, JSON.stringify(prefixMap, null, 2) + '\n', 'utf8');
    process.stdout.write(`image-snapshotter-fixture-gen: wrote ${result.blockCount} block file(s) + manifest to ${outAbs}\n`);
    return 0;
}
process.exit(main());
//# sourceMappingURL=generate-fixtures-cli.js.map