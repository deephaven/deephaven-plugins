import {
  LabeledValue as DHCLabeledValue,
  LabeledValueProps as DHCLabeledValueProps,
} from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { getSettings, RootState } from '@deephaven/redux';
import {
  CalendarDate,
  fromAbsolute,
  parseDate,
  parseZonedDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import { useSelector } from 'react-redux';
import { RangeValue } from './hooks';

type LabeledValueFormatOptions =
  | Intl.NumberFormatOptions
  | Intl.ListFormatOptions
  | { [date_format: string]: string };

const nanosToMillis = (nanos: number): number => Math.floor(nanos / 1_000_000);

const isDateFormat = (
  options?: LabeledValueFormatOptions
): options is { [date_format: string]: string } => {
  if (options === null || typeof options !== 'object') return false;
  return (
    Object.keys(options).some(key => key === 'date_format') &&
    Object.values(options).every(value => typeof value === 'string')
  );
};

const getFormattedDate = (
  dh: typeof DhType,
  value: string | number,
  tzString: string,
  formatOptions?: LabeledValueFormatOptions
): string | ZonedDateTime | CalendarDate => {
  const hasDateFormat = isDateFormat(formatOptions);
  const timezone = dh.i18n.TimeZone.getTimeZone(tzString);

  if (typeof value === 'string') {
    // date string
    if (hasDateFormat && formatOptions.date_format !== '') {
      const format = formatOptions.date_format;
      const zdt = parseZonedDateTime(`${value}T00:00:00[${timezone.id}]`);
      const date = zdt.toDate();
      return dh.i18n.DateTimeFormat.format(format, date, timezone);
    }
    return parseDate(value);
  }
  if (typeof value === 'number') {
    // nanoseconds
    if (hasDateFormat && formatOptions.date_format !== '') {
      const format = formatOptions.date_format;
      return dh.i18n.DateTimeFormat.format(format, value, timezone);
    }
    const millis = nanosToMillis(value);
    return fromAbsolute(millis, tzString);
  }
  return '';
};

export function LabeledValue(
  props: Omit<
    DHCLabeledValueProps<number | string | string[]>,
    'formatOptions'
  > & {
    formatOptions?:
      | LabeledValueFormatOptions
      | Intl.NumberFormatOptions
      | Intl.ListFormatOptions
      | undefined;
    timezone?: string;
    isDate: boolean;
  }
): JSX.Element {
  const dh = useApi();
  const settings = useSelector(getSettings<RootState>);
  const { timeZone: userTimezone } = settings;
  const {
    value: propValue,
    formatOptions,
    timezone,
    isDate,
    ...restProps
  } = props;

  let value:
    | number
    | string
    | string[]
    | CalendarDate
    | ZonedDateTime
    | RangeValue<number | ZonedDateTime | CalendarDate> = propValue;

  const hasDateFormat = isDateFormat(formatOptions);
  if (isDate) {
    const timezoneString = timezone != null ? timezone : userTimezone;

    if (typeof value === 'string' || typeof value === 'number') {
      // single value
      value = getFormattedDate(dh, value, timezoneString, formatOptions);
    } else if (
      typeof value === 'object' &&
      'start' in value &&
      'end' in value
    ) {
      // date range
      const dateRange = value as RangeValue<string | number>;
      const startDate = getFormattedDate(
        dh,
        dateRange.start,
        timezoneString,
        formatOptions
      );
      const endDate = getFormattedDate(
        dh,
        dateRange.end,
        timezoneString,
        formatOptions
      );

      if (typeof startDate === 'string' && typeof endDate === 'string') {
        // combine date strings manually
        value = `${startDate}\u2013${endDate}`;
      } else if (
        (startDate instanceof ZonedDateTime &&
          endDate instanceof ZonedDateTime) ||
        (startDate instanceof CalendarDate && endDate instanceof CalendarDate)
      ) {
        // pass start and end date objects for component to format
        value = { start: startDate, end: endDate };
      }
    }
  }

  return (
    <DHCLabeledValue
      value={value}
      formatOptions={hasDateFormat ? undefined : formatOptions}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restProps}
    />
  );
}
LabeledValue.displayName = 'LabeledValue';
export default LabeledValue;
