import { useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useSelector } from 'react-redux';
import { getSettings, RootState } from '@deephaven/redux';
import {
  CustomDateFormatOptions,
  getFormattedDate,
  isCustomDateFormatOptions,
} from '../utils';
import { RangeValue } from './useDateRangePickerProps';

export interface SerializedLabeledValuePropsInterface {
  value: number | string | string[] | RangeValue<number> | CustomDateRangeValue;
  formatOptions?:
    | CustomDateFormatOptions
    | Intl.NumberFormatOptions
    | Intl.ListFormatOptions
    | undefined;
  isDate: boolean;
  isNanoseconds: boolean;
}

type DeserializedValue<T> = T extends number
  ? number
  : T extends string
  ? string
  : T extends string[]
  ? string[]
  : T extends RangeValue<number>
  ? RangeValue<number>
  : never;

export interface DeserializedLabeledValuePropsInterface<T> {
  value: DeserializedValue<T>;
  formatOptions?: Intl.NumberFormatOptions | Intl.ListFormatOptions | undefined;
}

export type SerializedLabeledValueProps<TProps> = TProps &
  SerializedLabeledValuePropsInterface;

export type DeserializedLabeledValueProps<TProps> = Omit<
  TProps,
  keyof SerializedLabeledValuePropsInterface
> &
  DeserializedLabeledValuePropsInterface<TProps>;

interface CustomDateRangeValue {
  start: string;
  end: string;
  isStartNanoseconds: boolean;
  isEndNanoseconds: boolean;
}

function isCustomDateRangeValue(obj: unknown): obj is CustomDateRangeValue {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'start' in obj &&
    'end' in obj &&
    'isStartNanoseconds' in obj &&
    'isEndNanoseconds' in obj &&
    typeof (obj as CustomDateRangeValue).start === 'string' &&
    typeof (obj as CustomDateRangeValue).end === 'string' &&
    typeof (obj as CustomDateRangeValue).isStartNanoseconds === 'boolean' &&
    typeof (obj as CustomDateRangeValue).isEndNanoseconds === 'boolean'
  );
}

function useLabeledValueValueMemo(
  isDate: boolean,
  isNanoseconds: boolean,
  value: number | string | string[] | RangeValue<number> | CustomDateRangeValue,
  formatOptions?:
    | CustomDateFormatOptions
    | Intl.NumberFormatOptions
    | Intl.ListFormatOptions
    | undefined
): number | string | string[] | RangeValue<number> {
  const dh = useApi();
  const settings = useSelector(getSettings<RootState>);

  return useMemo(() => {
    if (isDate) {
      const dateFormatOptions = isCustomDateFormatOptions(formatOptions)
        ? formatOptions
        : undefined;

      if (typeof value === 'string') {
        // single value
        return getFormattedDate(
          dh,
          value,
          isNanoseconds,
          settings,
          dateFormatOptions
        );
      }

      if (isCustomDateRangeValue(value)) {
        // range value
        const startDate = getFormattedDate(
          dh,
          value.start,
          value.isStartNanoseconds,
          settings,
          dateFormatOptions
        );
        const endDate = getFormattedDate(
          dh,
          value.end,
          value.isEndNanoseconds,
          settings,
          dateFormatOptions
        );
        return `${startDate}\u2013${endDate}`;
      }
    }

    if (isCustomDateRangeValue(value)) {
      throw new Error(
        'Custom date range value received but isDate flag is false'
      );
    }

    return value;
  }, [dh, formatOptions, isDate, isNanoseconds, settings, value]);
}

function useLabeledValueFormatOptionsMemo(
  formatOptions?:
    | CustomDateFormatOptions
    | Intl.NumberFormatOptions
    | Intl.ListFormatOptions
    | undefined
): Intl.NumberFormatOptions | Intl.ListFormatOptions | undefined {
  return useMemo(() => {
    if (isCustomDateFormatOptions(formatOptions)) {
      return undefined;
    }
    return formatOptions;
  }, [formatOptions]);
}

export function useLabeledValueProps<TProps>({
  value: serializedValue,
  formatOptions: serializedFormatOptions,
  isDate,
  isNanoseconds,
  ...otherProps
}: SerializedLabeledValueProps<TProps>): DeserializedLabeledValueProps<TProps> {
  const deserializedValue = useLabeledValueValueMemo(
    isDate,
    isNanoseconds,
    serializedValue,
    serializedFormatOptions
  );
  const deserializedFormatOptions = useLabeledValueFormatOptionsMemo(
    serializedFormatOptions
  );

  return {
    value: deserializedValue as DeserializedValue<TProps>,
    formatOptions: deserializedFormatOptions,
    ...otherProps,
  };
}
