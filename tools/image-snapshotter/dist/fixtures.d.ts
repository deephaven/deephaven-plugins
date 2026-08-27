import type { Block } from './extract.js';
export interface GenerateAppdResult {
    blockCount: number;
    manifestPath: string;
    /** md5 → prefix used to mangle that block's exported names. */
    prefixMap: Map<string, string>;
}
/**
 * Compute the per-block prefix used both as the function name and as the
 * leading segment of every exported global. We MUST start with a letter
 * because Python identifiers can't begin with a digit (md5 hashes very
 * often do). `b` for "block".
 *
 * Single source of truth — fixtures, the manifest, the prefix-map, and
 * the spec's `mangle()` all read this.
 */
export declare function blockPrefix(md5: string): string;
/**
 * Build the body of a single per-block fixture file.
 * Exposed for unit tests.
 */
export declare function renderBlockFile(block: Block, page: string): string;
/**
 * Build the app.d manifest body listing every block fixture file.
 * Exposed for unit tests.
 */
export declare function renderManifest(blockFileNames: string[], appId?: string, appName?: string): string;
/**
 * Emit one `block_<md5>.py` per non-skip block plus a `tests.app` manifest
 * into `outDir`. Stale `block_*.py` files (e.g. blocks that were removed
 * from docs) are cleaned up. Returns counts plus the md5→prefix map so
 * callers can translate display names to mangled global names.
 */
export declare function generateAppdFixtures(blocks: Block[], outDir: string): GenerateAppdResult;
export interface FixtureWrite {
    page: string;
    pyPath: string;
    blockCount: number;
}
export declare function generateFixtures(blocks: Block[], outDir: string): FixtureWrite[];
