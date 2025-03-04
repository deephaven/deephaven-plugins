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
  value: string,
  timezoneString: string,
  isNanoseconds: boolean,
  formatOptions?: LabeledValueFormatOptions
): string | ZonedDateTime | CalendarDate => {
  const hasDateFormat = isDateFormat(formatOptions);
  const timezone = dh.i18n.TimeZone.getTimeZone(timezoneString);

  if (isNanoseconds) {
    // nanoseconds string
    if (hasDateFormat && formatOptions.date_format !== '') {
      const format = formatOptions.date_format;
      return dh.i18n.DateTimeFormat.format(format, value, timezone);
    }
    const millis = nanosToMillis(parseInt(value, 10)); // loss of precision is ok here since being converted to millis
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
};

export function LabeledValue(
  props: Omit<
    DHCLabeledValueProps<
      | number
      | string
      | string[]
      | CalendarDate
      | ZonedDateTime
      | RangeValue<number>
      | RangeValue<ZonedDateTime | CalendarDate>
    >,
    'formatOptions'
  > & {
    formatOptions?:
      | LabeledValueFormatOptions
      | Intl.NumberFormatOptions
      | Intl.ListFormatOptions
      | undefined;
    timezone?: string;
    isDate: boolean;
    isNanoseconds: boolean;
  }
): JSX.Element {
  const dh = useApi();
  const settings = useSelector(getSettings<RootState>);
  const { timeZone: userTimezone } = settings;
  const {
    value: propValue,
    formatOptions,
    timezone: propTimezone,
    isDate,
    isNanoseconds,
    ...restProps
  } = props;
  let value = propValue;

  if (isDate) {
    const timezoneString = propTimezone != null ? propTimezone : userTimezone;

    if (typeof value === 'string') {
      // single value
      value = getFormattedDate(
        dh,
        value,
        timezoneString,
        isNanoseconds,
        formatOptions
      );
    } else if (
      typeof value === 'object' &&
      'start' in value &&
      'end' in value &&
      'isStartNanoseconds' in value &&
      'isEndNanoseconds' in value &&
      typeof value.start === 'string' &&
      typeof value.end === 'string' &&
      typeof value.isStartNanoseconds === 'boolean' &&
      typeof value.isEndNanoseconds === 'boolean'
    ) {
      // date range
      const startDate = getFormattedDate(
        dh,
        value.start,
        timezoneString,
        value.isStartNanoseconds,
        formatOptions
      );
      const endDate = getFormattedDate(
        dh,
        value.end,
        timezoneString,
        value.isEndNanoseconds,
        formatOptions
      );
      if (typeof startDate === 'string' && typeof endDate === 'string') {
        // combine date strings manually
        value = `${startDate}\u2013${endDate}`;
      } else if (
        (startDate instanceof ZonedDateTime ||
          startDate instanceof CalendarDate) &&
        (endDate instanceof ZonedDateTime || endDate instanceof CalendarDate)
      ) {
        // pass start and end date objects for component to format
        value = { start: startDate, end: endDate };
      }
    }
  }

  return (
    <DHCLabeledValue
      // value={value}
      // Not sure why there is a type incompatibility on value, since SpectrumLabeledValueTypes
      // includes all the types defined on value, casting as never for now.
      value={value as never}
      formatOptions={isDateFormat(formatOptions) ? undefined : formatOptions}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restProps}
    />
  );
}
LabeledValue.displayName = 'LabeledValue';
export default LabeledValue;
