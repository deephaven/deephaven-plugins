/** Stable across runs and across hosts. See contract block above. */
export declare function codeMd5(code: string): string;
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
/** Pull blocks out of a single markdown file. */
export declare function extractBlocks(page: string, source: string): Block[];
/** Recursively walk `docsDir` for `.md` files and return every block found. */
export declare function walkDocs(docsDir: string): Block[];
