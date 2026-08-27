#!/usr/bin/env node
interface MissingRef {
    envelopePath: string;
    objectName: string;
    imageRel: string;
}
export interface ValidateResult {
    missing: MissingRef[];
    envelopesScanned: number;
    imageRefsScanned: number;
}
export declare function validateSnapshotAssets(snapshotsDir: string): ValidateResult;
export {};
