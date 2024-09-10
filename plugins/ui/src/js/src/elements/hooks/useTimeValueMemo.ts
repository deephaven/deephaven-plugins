import { useMemo } from 'react';
import { TimeValue, parseTimeValue } from '../utils/DateTimeUtils';

/**
 * Use memo to get a TimeValue from a string.
 *
 * @param value the string time value
 * @returns TimeValue
 */
export default function useDateTimeMemo(
  timeZone: string,
  value?: string
): TimeValue | undefined {
  return useMemo(() => parseTimeValue(timeZone, value), [timeZone, value]);
}
