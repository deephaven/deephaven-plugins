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
export declare function readOrInit(path: string, page: string): SnapshotEnvelope;
/**
 * Write `env` to `path` atomically (tmp file + rename) so that a half-written
 * JSON can never poison the repo state. Pretty-prints with stable key order.
 */
export declare function writeAtomic(path: string, env: SnapshotEnvelope): void;
