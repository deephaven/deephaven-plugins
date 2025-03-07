import {
  DateValue,
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  Time,
  parseDate,
  parseDateTime,
  parseZonedDateTime,
  parseTime,
  toTimeZone,
  fromAbsolute,
} from '@internationalized/date';
import type { dh as DhType } from '@deephaven/jsapi-types';

export type MappedDateValue<T> = T extends ZonedDateTime
  ? ZonedDateTime
  : T extends CalendarDateTime
  ? CalendarDateTime
  : T extends CalendarDate
  ? CalendarDate
  : never;

export type Granularity = 'day' | 'hour' | 'minute' | 'second';

export type TimeValue = Time | CalendarDateTime | ZonedDateTime;

export type TimeGranularity = 'hour' | 'minute' | 'second';

export type MappedTimeValue<T> = T extends ZonedDateTime
  ? ZonedDateTime
  : T extends CalendarDateTime
  ? CalendarDateTime
  : T extends Time
  ? Time
  : never;

type DateTimeValue = CalendarDateTime | ZonedDateTime;

export type CustomDateFormatOptions =
  | Intl.NumberFormatOptions
  | Intl.ListFormatOptions
  | { [date_format: string]: string };

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

  const dateTime = parseDateTimeInternal(timeZone, value);
  if (dateTime != null) {
    return dateTime;
  }

  throw new Error(`Invalid date value string: ${value}`);
}

/**
 * Parses a date value string into a DateValue for a Calendar.
 *
 * @param value the string date value
 * @returns DateValue
 */
export function parseCalendarValue(value?: string): DateValue | undefined {
  if (value === undefined) {
    return value;
  }

  // Try to parse and ISO 8601 date string, e.g. "2021-02-03"
  try {
    return parseDate(value);
  } catch (ignore) {
    // ignore
  }

  const dateTime = parseDateTimeInternal(null, value);
  if (dateTime != null) {
    return dateTime;
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

/**
 * Parses a date value string into a DateValue for a Calendar. Allows null.
 *
 * @param value the string date value
 * @returns DateValue or null
 */
export function parseNullableCalendarValue(
  value?: string | null
): DateValue | null | undefined {
  if (value === null) {
    return value;
  }

  return parseCalendarValue(value);
}

/**
 * Common parsing used for both DateTimes, Times and Calendars.
 * For Calendars, the time zone should be null to parse Instant without time zone.
 *
 * @param timeZone the time zone to use, null for Calendars
 * @param value the string date value
 * @returns a DateTimeValue or null
 */
function parseDateTimeInternal(
  timeZone: string | null,
  value: string
): DateTimeValue | null {
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
    const instantValue = value.slice(0, -1);
    if (timeZone != null) {
      // DateTime and Time components that display the time zone will want to parse Instant to a ZonedDateTime to display the time zone.
      try {
        return toTimeZone(parseZonedDateTime(`${instantValue}[UTC]`), timeZone);
      } catch (ignore) {
        // ignore
      }
    } else {
      // Calendars which do not display a time zone will want to parse Instant to a CalendarDateTime.
      try {
        return parseDateTime(instantValue);
      } catch (ignore) {
        // ignore
      }
    }
  }

  return null;
}

/**
 * Parses a time value string into a TimeValue.
 *
 * @param timeZone the time zone to use
 * @param value the string date value
 * @returns TimeValue
 */
export function parseTimeValue(
  timeZone: string,
  value?: string
): TimeValue | undefined {
  if (value === undefined) {
    return value;
  }

  // Try to parse and ISO 8601 time string, e.g. "04:05:06"
  try {
    return parseTime(value);
  } catch (ignore) {
    // ignore
  }

  const dateTime = parseDateTimeInternal(timeZone, value);
  if (dateTime != null) {
    return dateTime;
  }

  throw new Error(`Invalid time value string: ${value}`);
}

/**
 * Parses a time value string into a TimeValue. Allows null.
 *
 * @param timeZone the time zone to use
 * @param value the string time value
 * @returns TimeValue or null
 */
export function parseNullableTimeValue(
  timeZone: string,
  value?: string | null
): TimeValue | null | undefined {
  if (value === null) {
    return value;
  }

  return parseTimeValue(timeZone, value);
}

export function dateValuetoIsoString(value: DateValue): string {
  if (value instanceof CalendarDateTime) {
    // Use Instance for CalendarDateTime
    return `${value.toString()}Z`;
  }

  return value.toString();
}

export function nanosToMillis(nanos: number): number {
  return Math.floor(nanos / 1_000_000);
}

export function isCustomDateFormatOptions(
  options?: CustomDateFormatOptions
): options is { [date_format: string]: string } {
  if (options === null || typeof options !== 'object') return false;

  return (
    Object.keys(options).length === 1 &&
    'date_format' in options &&
    typeof options.date_format === 'string'
  );
}

/**
 * Formats a datetime string value representing a date (e.g. 2020-01-01) or a nanosecond value.
 * When formatOptions is provided, the dh JS API is used to format the date, and a string is returned.
 * Otherwise, @internationalized/date is used to parse dates into CalendarDate and nanoseconds into ZonedDateTime.
 *
 * @param dh The JS API object
 * @param value The string datetime value
 * @param timezoneString The timezone identifier used for formatting
 * @param isNanoseconds If the datetime value is in nanoseconds
 * @param formatOptions The format options
 * @returns string or ZonedDateTime or CalendarDate
 */
export function getFormattedDate(
  dh: typeof DhType,
  value: string,
  timezoneString: string,
  isNanoseconds: boolean,
  formatOptions?: CustomDateFormatOptions
): string | ZonedDateTime | CalendarDate {
  const hasDateFormat = isCustomDateFormatOptions(formatOptions);
  const timezone = dh.i18n.TimeZone.getTimeZone(timezoneString);

  if (isNanoseconds) {
    // nanoseconds string
    if (hasDateFormat && formatOptions.date_format !== '') {
      const format = formatOptions.date_format;
      return dh.i18n.DateTimeFormat.format(format, value, timezone);
    }
    // loss of precision is ok here since being converted to millis
    const millis = nanosToMillis(parseInt(value, 10));
    return fromAbsolute(millis, timezoneString);
  }

  // date string
  if (hasDateFormat && formatOptions.date_format !== '') {
    const format = formatOptions.date_format;
    const zdt = parseZonedDateTime(`${value}T00:00:00[${timezone.id}]`);
    const date = zdt.toDate();
    return dh.i18n.DateTimeFormat.format(format, date, timezone);
  }
  return parseDate(value);
}
