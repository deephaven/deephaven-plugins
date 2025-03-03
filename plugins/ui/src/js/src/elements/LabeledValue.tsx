import {
  LabeledValue as DHCLabeledValue,
  LabeledValueProps as DHCLabeledValueProps,
} from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { getSettings, RootState } from '@deephaven/redux';
import { parseZonedDateTime, ZonedDateTime } from '@internationalized/date';
import { useSelector } from 'react-redux';

type LabeledValueFormatOptions =
  | Intl.NumberFormatOptions
  | Intl.ListFormatOptions
  | { [date_format: string]: string };

// todo: make default formatting locale-aware
const DEFAULT_DATE_FORMAT = `M/d/yyyy`;
const DEFAULT_DATETIME_FORMAT = `M/d/yyyy, h:mm:ss a`;

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
    DHCLabeledValueProps<number | string | string[] | ZonedDateTime>,
    'formatOptions'
  > & {
    formatOptions?: LabeledValueFormatOptions | undefined;
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
      // local date string
      const format =
        (hasDateFormat ? formatOptions.date_format : DEFAULT_DATE_FORMAT) ||
        DEFAULT_DATE_FORMAT;

      const zdt = parseZonedDateTime(`${value}T00:00:00[${tz.id}]`);
      const date = zdt.toDate();
      value = dh.i18n.DateTimeFormat.format(format, date, tz);
    } else if (typeof value === 'number') {
      // nanoseconds
      const format =
        (hasDateFormat ? formatOptions.date_format : DEFAULT_DATETIME_FORMAT) ||
        DEFAULT_DATETIME_FORMAT;
      value = dh.i18n.DateTimeFormat.format(format, value, tz);
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
