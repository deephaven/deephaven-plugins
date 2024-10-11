import {
  ProgressCircle as DHCProgressCircle,
  ProgressCircleProps as DHCProgressCircleProps,
} from '@deephaven/components';

export function ProgressCircle(
  props: DHCProgressCircleProps
): JSX.Element | null {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCProgressCircle {...props} />;
}

ProgressCircle.displayName = 'ProgressCircle';

export default ProgressCircle;
