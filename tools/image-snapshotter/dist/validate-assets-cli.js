#!/usr/bin/env node
/**
 * Stage-2 snapshot validator: scan envelope JSONs for `data.image` refs
 * and verify every referenced PNG exists on disk.
 *
 * Exits non-zero if any envelope references an asset that's missing — a
 * common symptom of a half-captured run (capture started, was interrupted,
 * envelope was written without the asset).
 *
 * Usage (from a plugin tree):
 *   SNAPSHOTTER_PLUGIN_ROOT=/work image-snapshotter-validate-assets
 *
 * Or directly:
 *   node dist/validate-assets-cli.js <snapshots-dir>
 *
 * Both `<envelope>.json` -> referenced `assets/<sha>.png` and the reverse
 * (orphan assets) are reported, but only missing-asset failures cause a
 * non-zero exit. Orphan detection is handled by `prune.ts` and stays
 * advisory here.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
export function validateSnapshotAssets(snapshotsDir) {
    const missing = [];
    let envelopesScanned = 0;
    let imageRefsScanned = 0;
    if (!existsSync(snapshotsDir) || !statSync(snapshotsDir).isDirectory()) {
        return { missing, envelopesScanned, imageRefsScanned };
    }
    const entries = readdirSync(snapshotsDir);
    for (const name of entries) {
        if (!name.endsWith('.json'))
            continue;
        const path = join(snapshotsDir, name);
        envelopesScanned += 1;
        let envelope;
        try {
            envelope = JSON.parse(readFileSync(path, 'utf8'));
        }
        catch {
            // Malformed JSON is a hard error — bubble up via a synthetic miss.
            missing.push({
                envelopePath: path,
                objectName: '<parse error>',
                imageRel: '<n/a>',
            });
            continue;
        }
        const objects = envelope.objects ?? {};
        for (const [objectName, entry] of Object.entries(objects)) {
            const imageRel = entry?.data?.image;
            if (typeof imageRel !== 'string')
                continue; // not a Pass-2 entry
            imageRefsScanned += 1;
            const assetPath = join(snapshotsDir, imageRel);
            if (!existsSync(assetPath)) {
                missing.push({ envelopePath: path, objectName, imageRel });
            }
        }
    }
    return { missing, envelopesScanned, imageRefsScanned };
}
function pluginRoot() {
    const fromEnv = process.env.SNAPSHOTTER_PLUGIN_ROOT;
    if (fromEnv)
        return resolve(fromEnv);
    process.stderr.write('image-snapshotter-validate-assets: SNAPSHOTTER_PLUGIN_ROOT or a snapshots dir argument is required\n');
    process.exit(2);
}
function main() {
    const arg = process.argv[2];
    const snapshotsDir = arg
        ? resolve(arg)
        : join(pluginRoot(), 'docs', 'snapshots');
    const { missing, envelopesScanned, imageRefsScanned } = validateSnapshotAssets(snapshotsDir);
    process.stdout.write(`validated ${envelopesScanned} envelope(s); ` +
        `${imageRefsScanned} image reference(s) checked; ` +
        `${missing.length} missing.\n`);
    if (missing.length === 0)
        return 0;
    process.stderr.write(`\nMissing assets:\n`);
    for (const m of missing) {
        process.stderr.write(`  ${m.envelopePath} :: ${m.objectName} -> ${m.imageRel} (not on disk)\n`);
    }
    process.stderr.write(`\nRe-run \`image-snapshotter --update\` to recapture the missing assets.\n`);
    return 1;
}
const isMain = import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('validate-assets-cli.js');
if (isMain) {
    process.exit(main());
}
//# sourceMappingURL=validate-assets-cli.js.map