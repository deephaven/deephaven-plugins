import {
  LabeledValue as DHCLabeledValue,
  LabeledValueProps as DHCLabeledValueProps,
} from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { getSettings, RootState } from '@deephaven/redux';
import {
  CalendarDate,
  fromAbsolute,
  parseDate,
  parseZonedDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import { useSelector } from 'react-redux';

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

export function LabeledValue(
  props: Omit<
    DHCLabeledValueProps<
      number | string | string[] | CalendarDate | ZonedDateTime
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
  let value = propValue;

  const hasDateFormat = isDateFormat(formatOptions);
  if (isDate) {
    const tzString = timezone != null ? timezone : userTimezone;
    const tz = dh.i18n.TimeZone.getTimeZone(tzString);

    if (typeof value === 'string') {
      // date string
      if (hasDateFormat && formatOptions.date_format !== '') {
        const format = formatOptions.date_format;
        const zdt = parseZonedDateTime(`${value}T00:00:00[${tz.id}]`);
        const date = zdt.toDate();
        value = dh.i18n.DateTimeFormat.format(format, date, tz);
      } else {
        value = parseDate(value);
      }
    } else if (typeof value === 'number') {
      // nanoseconds
      if (hasDateFormat && formatOptions.date_format !== '') {
        const format = formatOptions.date_format;
        value = dh.i18n.DateTimeFormat.format(format, value, tz);
      } else {
        const millis = nanosToMillis(value);
        value = fromAbsolute(millis, tzString);
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
