import {
  DateValue,
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  parseDate,
  parseDateTime,
  parseZonedDateTime,
  toTimeZone,
} from '@internationalized/date';

export type MappedDateValue<T> = T extends ZonedDateTime
  ? ZonedDateTime
  : T extends CalendarDateTime
  ? CalendarDateTime
  : T extends CalendarDate
  ? CalendarDate
  : never;

export type Granularity = 'day' | 'hour' | 'minute' | 'second';

/**
 * Checks if a string is an Instant.
 *
 * @param value the string date value
 * @returns true if the string is an Instant
 */
export function isStringInstant(value?: string | null): boolean {
  return value != null && value.endsWith('Z');
}

/**
 * Parses a date value string into a DateValue.
 *
 * @param timeZone the time zone to use
 * @param value the string date value
 * @returns DateValue
 */
export function parseDateValue(
  timeZone: string,
  value?: string
): DateValue | undefined {
  if (value === undefined) {
    return value;
  }

  // Try to parse and ISO 8601 date string, e.g. "2021-02-03"
  try {
    return parseDate(value);
  } catch (ignore) {
    // ignore
  }

  // Note that the Python API will never send a string like this. This is here for correctness.
  // Try to parse an ISO 8601 date time string, e.g. "2021-03-03T04:05:06"
  try {
    return parseDateTime(value);
  } catch (ignore) {
    // ignore
  }

  // Try to parse an ISO 8601 zoned date time string, e.g. "2021-04-04T05:06:07[America/New_York]"
  try {
    return parseZonedDateTime(value);
  } catch (ignore) {
    // ignore
  }

  // Try to parse a non-ISO 8601 zoned date time string, e.g. "2021-04-04T05:06:07 America/New_York"
  const parts = value.split(' ');
  if (parts.length === 2) {
    const isoString = `${parts[0]}[${parts[1]}]`;
    try {
      return parseZonedDateTime(isoString);
    } catch (ignore) {
      // ignore
    }
  }

  // This is an edge case. The Python API will parse these to an Instant,
  // but the user may explicitly create a ZonedDateTime with a UTC offset.
  // Try to parse an ZonedDateTime "2021-04-04T05:06:07Z[UTC]"
  if (value.endsWith('Z[UTC]')) {
    try {
      return parseZonedDateTime(value.replace('Z', ''));
    } catch (ignore) {
      // ignore
    }
  }

  // Try to parse an Instant "2021-04-04T05:06:07Z"
  if (value.endsWith('Z')) {
    try {
      return toTimeZone(
        parseZonedDateTime(`${value.slice(0, -1)}[UTC]`),
        timeZone
      );
    } catch (ignore) {
      // ignore
    }
  }

  throw new Error(`Invalid date value string: ${value}`);
}

/**
 * Parses a date value string into a DateValue. Allows null.
 *
 * @param timeZone the time zone to use
 * @param value the string date value
 * @returns DateValue or null
 */
export function parseNullableDateValue(
  timeZone: string,
  value?: string | null
): DateValue | null | undefined {
  if (value === null) {
    return value;
  }

  return parseDateValue(timeZone, value);
}
