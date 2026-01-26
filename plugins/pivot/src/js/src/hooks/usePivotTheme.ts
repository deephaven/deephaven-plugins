import { useMemo } from 'react';
import { useTheme } from '@deephaven/components';
import Log from '@deephaven/log';
import { getIrisGridPivotTheme } from '../IrisGridPivotTheme';

const log = Log.module('@deephaven/js-plugin-pivot/usePivotTheme');

/**
 * Hook that gets the pivot theme based on current theme
 * @returns Pivot theme
 */
export function usePivotTheme(): ReturnType<typeof getIrisGridPivotTheme> {
  const theme = useTheme();

  return useMemo(() => {
    log.debug('Theme changed, updating pivot theme', theme);
    return getIrisGridPivotTheme();
  }, [theme]);
}

export default usePivotTheme;
