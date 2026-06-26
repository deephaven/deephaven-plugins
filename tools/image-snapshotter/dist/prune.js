/**
 * Orphan asset cleanup.
 *
 * Walks `<snapshotsDir>/*.json`, collects every `objects[*].data.image`
 * value, then deletes any `<snapshotsDir>/assets/*.png` that is not in the
 * referenced set. Returns the list of deleted asset paths.
 */
import { readdirSync, readFileSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export function collectReferencedAssets(snapshotsDir) {
    const referenced = new Set();
    if (!existsSync(snapshotsDir))
        return referenced;
    for (const name of readdirSync(snapshotsDir)) {
        if (!name.endsWith('.json'))
            continue;
        const full = join(snapshotsDir, name);
        let raw;
        try {
            raw = readFileSync(full, 'utf8');
        }
        catch {
            continue;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            continue;
        }
        const objs = parsed.objects ?? {};
        for (const key of Object.keys(objs)) {
            const data = objs[key]?.data;
            if (data && typeof data === 'object' && typeof data.image === 'string') {
                // Stored as `assets/<sha>.png` (relative). Normalize to basename.
                const image = data.image;
                const slash = image.lastIndexOf('/');
                referenced.add(slash >= 0 ? image.slice(slash + 1) : image);
            }
        }
    }
    return referenced;
}
export function pruneOrphanAssets(snapshotsDir) {
    const assetsDir = join(snapshotsDir, 'assets');
    const result = { deleted: [], kept: 0, referenced: 0 };
    if (!existsSync(assetsDir))
        return result;
    const referenced = collectReferencedAssets(snapshotsDir);
    result.referenced = referenced.size;
    for (const name of readdirSync(assetsDir)) {
        if (!name.endsWith('.png'))
            continue;
        const full = join(assetsDir, name);
        try {
            if (!statSync(full).isFile())
                continue;
        }
        catch {
            continue;
        }
        if (referenced.has(name)) {
            result.kept += 1;
            continue;
        }
        try {
            unlinkSync(full);
            result.deleted.push(full);
        }
        catch {
            // ignore
        }
    }
    return result;
}
//# sourceMappingURL=prune.js.map