import {
  chooseRecoveryTarget,
  type PivotBuilderConfig,
  type PivotRecoveryState,
} from './pivotBuilderModel';

function pivotConfig(rowKeys: string[]): PivotBuilderConfig {
  return {
    pivot: { rowKeys, columnKeys: [], aggregations: [] },
    rollup: null,
    totals: null,
  };
}

const EMPTY: PivotBuilderConfig = { pivot: null, rollup: null, totals: null };

describe('chooseRecoveryTarget', () => {
  it('reverts to the last good pivot when one exists and not recovering', () => {
    const lastGood = pivotConfig(['a']);
    const failed = pivotConfig(['b']);
    const state: PivotRecoveryState = {
      lastGoodBuilderConfig: lastGood,
      isRecoveringPivot: false,
    };

    const decision = chooseRecoveryTarget(failed, state);

    expect(decision.target).toBe(lastGood);
    expect(decision.nextLastGoodBuilderConfig).toBe(lastGood);
    expect(decision.nextIsRecoveringPivot).toBe(true);
  });

  it('drops to the empty config when there is no last good pivot', () => {
    const state: PivotRecoveryState = {
      lastGoodBuilderConfig: null,
      isRecoveringPivot: false,
    };

    const decision = chooseRecoveryTarget(pivotConfig(['b']), state);

    expect(decision.target).toEqual(EMPTY);
    expect(decision.nextLastGoodBuilderConfig).toBeNull();
    expect(decision.nextIsRecoveringPivot).toBe(false);
  });

  it('drops to the empty config when already recovering', () => {
    const lastGood = pivotConfig(['a']);
    const state: PivotRecoveryState = {
      lastGoodBuilderConfig: lastGood,
      isRecoveringPivot: true,
    };

    const decision = chooseRecoveryTarget(pivotConfig(['b']), state);

    expect(decision.target).toEqual(EMPTY);
    // Clears the now-known-bad target so it can't be re-selected later.
    expect(decision.nextLastGoodBuilderConfig).toBeNull();
    expect(decision.nextIsRecoveringPivot).toBe(true);
  });

  it('drops to the empty config when the last good equals the failed config', () => {
    const config = pivotConfig(['a']);
    const state: PivotRecoveryState = {
      lastGoodBuilderConfig: config,
      isRecoveringPivot: false,
    };

    // Deep-equal (not just reference) — a fresh object with the same shape.
    const decision = chooseRecoveryTarget(pivotConfig(['a']), state);

    expect(decision.target).toEqual(EMPTY);
    expect(decision.nextLastGoodBuilderConfig).toBeNull();
    expect(decision.nextIsRecoveringPivot).toBe(false);
  });

  it('reverts to last good when the failed config is null', () => {
    const lastGood = pivotConfig(['a']);
    const state: PivotRecoveryState = {
      lastGoodBuilderConfig: lastGood,
      isRecoveringPivot: false,
    };

    const decision = chooseRecoveryTarget(null, state);

    expect(decision.target).toBe(lastGood);
    expect(decision.nextIsRecoveringPivot).toBe(true);
  });

  it('returns a fresh empty config object (not a shared mutable singleton)', () => {
    const state: PivotRecoveryState = {
      lastGoodBuilderConfig: null,
      isRecoveringPivot: false,
    };

    const first = chooseRecoveryTarget(null, state).target;
    const second = chooseRecoveryTarget(null, state).target;

    expect(first).toEqual(EMPTY);
    expect(first).not.toBe(second);
  });
});
