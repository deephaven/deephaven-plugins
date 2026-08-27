export interface PruneResult {
    deleted: string[];
    kept: number;
    referenced: number;
}
export declare function collectReferencedAssets(snapshotsDir: string): Set<string>;
export declare function pruneOrphanAssets(snapshotsDir: string): PruneResult;
