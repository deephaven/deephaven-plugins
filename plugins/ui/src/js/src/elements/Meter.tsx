import {
  Meter as DHCMeter,
  MeterProps as DHCMeterProps,
} from '@deephaven/components';

export function Meter(props: DHCMeterProps): JSX.Element | null {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCMeter {...props} />;
}

Meter.displayName = 'Meter';

export default Meter;
