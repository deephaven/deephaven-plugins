import {
  ProgressBar as DHCProgressBar,
  ProgressBarProps as DHCProgressBarProps,
} from '@deephaven/components';

export function ProgressBar(props: DHCProgressBarProps): JSX.Element | null {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCProgressBar {...props} />;
}

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
