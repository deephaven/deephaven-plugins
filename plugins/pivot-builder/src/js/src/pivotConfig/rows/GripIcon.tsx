import { ReactFontAwesome } from '@deephaven/components';
import { vsGripper } from '@deephaven/icons';

const { FontAwesomeIcon } = ReactFontAwesome;

/** Drag-handle grip icon. */
export default function GripIcon(): JSX.Element {
  return <FontAwesomeIcon icon={vsGripper} />;
}
