/**
 * Ambient type declarations for @deephaven/js-plugin-pivot.
 * The pivot plugin's CJS bundle doesn't ship .d.ts files.
 * These declarations provide minimal typing for the exports we consume.
 */
declare module '@deephaven/js-plugin-pivot' {
  import type { IrisGridModel } from '@deephaven/iris-grid';

  export class IrisGridPivotModel extends IrisGridModel {
    constructor(
      dh: unknown,
      pivotTable: unknown,
      formatter?: unknown,
      config?: unknown
    );
  }

  export function isIrisGridPivotModel(model: unknown): boolean;
  export function isCorePlusDh(dh: unknown): boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function usePivotMouseHandlers(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function usePivotRenderer(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function usePivotTheme(): any;
}
