import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import {
  parseDateValue,
  parseNullableDateValue,
  isStringInstant,
  parseTimeValue,
  parseNullableTimeValue,
  parseCalendarValue,
  parseNullableCalendarValue,
  dateValuetoIsoString,
} from './DateTimeUtils';

const DEFAULT_TIME_ZONE = 'UTC';
const NY_TIME_ZONE = 'America/New_York';

describe('isStringInstant', () => {
  it('should return true for an instant string', () => {
    expect(isStringInstant('2021-03-03T04:05:06Z')).toBeTruthy();
  });
  it('should return false for a non-instant string', () => {
    expect(isStringInstant('2021-03-03T04:05:06')).toBeFalsy();
  });
  it('should return false for null', () => {
    expect(isStringInstant(null)).toBeFalsy();
  });
});

describe('parseDateValue', () => {
  const isoDate = '2021-02-03';
  const isoDateTime = '2021-03-03T04:05:06';
  const isoZonedDateTime = '2021-04-04T05:06:07-04:00[America/New_York]';
  const nonIsoZonedDateTime = '2021-04-04T05:06:07 America/New_York';
  const instantString = '2021-03-03T04:05:06Z';
  const instantStringUTC = '2021-03-03T04:05:06Z[UTC]';
  const utcOutput = '2021-03-03T04:05:06+00:00[UTC]';
  const nyOutput = '2021-03-02T23:05:06-05:00[America/New_York]';
  const invalidDate = 'invalid-date';

  it('should return null if the value is null', () => {
    expect(parseNullableDateValue(DEFAULT_TIME_ZONE, null)).toBeNull();
  });

  it('should return undefined if the value is undefined', () => {
    expect(parseDateValue(DEFAULT_TIME_ZONE, undefined)).toBeUndefined();
  });

  it('should parse an ISO 8601 date string', () => {
    expect(parseDateValue(DEFAULT_TIME_ZONE, isoDate)?.toString()).toEqual(
      isoDate
    );
  });

  it('should parse an ISO 8601 date time string', () => {
    expect(parseDateValue(DEFAULT_TIME_ZONE, isoDateTime)?.toString()).toEqual(
      isoDateTime
    );
  });

  it('should parse an ISO 8601 zoned date time string', () => {
    expect(
      parseDateValue(DEFAULT_TIME_ZONE, isoZonedDateTime)?.toString()
    ).toEqual(isoZonedDateTime);
  });

  it('should parse a non-ISO 8601 zoned date time string', () => {
    expect(
      parseDateValue(DEFAULT_TIME_ZONE, nonIsoZonedDateTime)?.toString()
    ).toEqual(isoZonedDateTime);
  });

  it('should parse an instant string', () => {
    expect(
      parseDateValue(DEFAULT_TIME_ZONE, instantString)?.toString()
    ).toEqual(utcOutput);
    expect(
      parseDateValue(DEFAULT_TIME_ZONE, instantStringUTC)?.toString()
    ).toEqual(utcOutput);
  });

  it('should throw an error if the value is invalid', () => {
    expect(() => parseDateValue(DEFAULT_TIME_ZONE, invalidDate)).toThrow();
  });

  it('should parse an instant time string with a different time zone', () => {
    expect(parseDateValue(NY_TIME_ZONE, instantString)?.toString()).toEqual(
      nyOutput
    );
  });
});

describe('parseTimeValue', () => {
  const isoTime = '04:05:06';
  const isoDateTime = '2021-03-03T04:05:06';
  const isoZonedDateTime = '2021-04-04T05:06:07-04:00[America/New_York]';
  const nonIsoZonedDateTime = '2021-04-04T05:06:07 America/New_York';
  const instantString = '2021-03-03T04:05:06Z';
  const instantStringUTC = '2021-03-03T04:05:06Z[UTC]';
  const utcOutput = '2021-03-03T04:05:06+00:00[UTC]';
  const nyOutput = '2021-03-02T23:05:06-05:00[America/New_York]';
  const invalidTime = 'invalid-time';

  it('should return null if the value is null', () => {
    expect(parseNullableTimeValue(DEFAULT_TIME_ZONE, null)).toBeNull();
  });

  it('should return undefined if the value is undefined', () => {
    expect(parseTimeValue(DEFAULT_TIME_ZONE, undefined)).toBeUndefined();
  });

  it('should parse an ISO 8601 time string', () => {
    expect(parseTimeValue(DEFAULT_TIME_ZONE, isoTime)?.toString()).toEqual(
      isoTime
    );
  });

  it('should parse an ISO 8601 date time string', () => {
    expect(parseTimeValue(DEFAULT_TIME_ZONE, isoDateTime)?.toString()).toEqual(
      isoDateTime
    );
  });

  it('should parse an ISO 8601 zoned date time string', () => {
    expect(
      parseTimeValue(DEFAULT_TIME_ZONE, isoZonedDateTime)?.toString()
    ).toEqual(isoZonedDateTime);
  });

  it('should parse a non-ISO 8601 zoned date time string', () => {
    expect(
      parseTimeValue(DEFAULT_TIME_ZONE, nonIsoZonedDateTime)?.toString()
    ).toEqual(isoZonedDateTime);
  });

  it('should parse an instant string', () => {
    expect(
      parseTimeValue(DEFAULT_TIME_ZONE, instantString)?.toString()
    ).toEqual(utcOutput);
    expect(
      parseTimeValue(DEFAULT_TIME_ZONE, instantStringUTC)?.toString()
    ).toEqual(utcOutput);
  });

  it('should throw an error if the value is invalid', () => {
    expect(() => parseTimeValue(DEFAULT_TIME_ZONE, invalidTime)).toThrow();
  });

  it('should parse an instant time string with a different time zone', () => {
    expect(parseTimeValue(NY_TIME_ZONE, instantString)?.toString()).toEqual(
      nyOutput
    );
  });
});

describe('parseNullableDateValue', () => {
  it('should return null if the value is null', () => {
    expect(parseNullableCalendarValue(null)).toBeNull();
  });
});

describe('parseCalendarValue', () => {
  const isoDate = '2021-02-03';
  const isoDateTime = '2021-03-03T04:05:06';
  const isoZonedDateTime = '2021-04-04T05:06:07-04:00[America/New_York]';
  const nonIsoZonedDateTime = '2021-04-04T05:06:07 America/New_York';
  const instantString = '2021-03-03T04:05:06Z';
  const instantStringUTC = '2021-03-03T04:05:06Z[UTC]';
  const instantStringNoTimeZone = '2021-03-03T04:05:06';
  const utcOutput = '2021-03-03T04:05:06+00:00[UTC]';
  const invalidDate = 'invalid-date';

  it('should return undefined if the value is undefined', () => {
    expect(parseCalendarValue(undefined)).toBeUndefined();
  });

  it('should parse an ISO 8601 date string', () => {
    expect(parseCalendarValue(isoDate)?.toString()).toEqual(isoDate);
  });

  it('should parse an ISO 8601 date time string', () => {
    expect(parseCalendarValue(isoDateTime)?.toString()).toEqual(isoDateTime);
  });

  it('should parse an ISO 8601 zoned date time string', () => {
    expect(parseCalendarValue(isoZonedDateTime)?.toString()).toEqual(
      isoZonedDateTime
    );
  });

  it('should parse a non-ISO 8601 zoned date time string', () => {
    expect(parseCalendarValue(nonIsoZonedDateTime)?.toString()).toEqual(
      isoZonedDateTime
    );
  });

  it('should parse an instant string', () => {
    expect(parseCalendarValue(instantString)?.toString()).toEqual(
      instantStringNoTimeZone
    );
    expect(parseCalendarValue(instantStringUTC)?.toString()).toEqual(utcOutput);
  });

  it('should throw an error if the value is invalid', () => {
    expect(() => parseCalendarValue(invalidDate)).toThrow();
  });
});

describe('dateValuetoIsoString', () => {
  it('handles a CalendarDate', () => {
    const date = new CalendarDate(2021, 3, 4);
    expect(dateValuetoIsoString(date)).toEqual('2021-03-04');
  });

  it('handles a CalendarDateTime', () => {
    const date = new CalendarDateTime(2021, 3, 4, 5, 6, 7);
    expect(dateValuetoIsoString(date)).toEqual('2021-03-04T05:06:07Z');
  });

  it('handles a ZonedDateTime', () => {
    const date = new ZonedDateTime(2021, 3, 4, 'America/New_York', 0, 0, 0, 0);
    expect(dateValuetoIsoString(date)).toEqual(
      '2021-03-04T00:00:00+00:00[America/New_York]'
    );
  });
});
