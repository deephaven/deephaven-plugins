import { parseDateValue, parseNullableDateValue } from './useDatepickerProps';

describe('parseDateValue', () => {
  const isoDate = '2021-02-03';
  const isoDateTime = '2021-03-03T04:05:06';
  const isoZonedDateTime = '2021-04-04T05:06:07-04:00[America/New_York]';
  const nonIsoZonedDateTime = '2021-04-04T05:06:07 America/New_York';
  const instantString = '2021-03-03T04:05:06Z';
  const invalidDate = 'invalid-date';

  it('should return null if the value is null', () => {
    expect(parseNullableDateValue(null)).toBeNull();
  });

  it('should return undefined if the value is undefined', () => {
    expect(parseDateValue(undefined)).toBeUndefined();
  });

  it('should parse an ISO 8601 date string', () => {
    expect(parseDateValue(isoDate)?.toString()).toEqual(isoDate);
  });

  it('should parse an ISO 8601 date time string', () => {
    expect(parseDateValue(isoDateTime)?.toString()).toEqual(isoDateTime);
  });

  it('should parse an ISO 8601 zoned date time string', () => {
    expect(parseDateValue(isoZonedDateTime)?.toString()).toEqual(
      isoZonedDateTime
    );
  });

  it('should parse a non-ISO 8601 zoned date time string', () => {
    expect(parseDateValue(nonIsoZonedDateTime)?.toString()).toEqual(
      isoZonedDateTime
    );
  });

  it('should parse an instant string', () => {
    expect(parseDateValue(instantString)?.toString()).toEqual(isoDateTime);
  });

  it('should throw an error if the value is invalid', () => {
    expect(() => parseDateValue(invalidDate)).toThrow();
  });
});
