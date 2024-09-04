import { useMemo } from 'react';
import { DateValue } from '@internationalized/date';
import { parseDateValue } from '../utils/DateTimeUtils';

/**
 * Use memo to get a DateValue from a string.
 *
 * @param value the string date value
 * @returns DateValue
 */
export default function useDateValueMemo(
  timeZone: string,
  value?: string
): DateValue | undefined {
  return useMemo(() => parseDateValue(timeZone, value), [timeZone, value]);
}
