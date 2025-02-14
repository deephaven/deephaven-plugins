import {
  ColorPicker as DHCColorPicker,
  ColorPickerProps,
  ColorEditor as DHCColorEditor,
} from '@deephaven/components';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';

type DHCColorPickerProps = Omit<ColorPickerProps, 'onChange'> & {
  onChange?: (color: string) => void;
};
// type DHCColor = Exclude<DHCColorPickerProps['value'], string | undefined>;
type DHCColor = DHCColorPickerProps['value'];

export function ColorPicker(props: DHCColorPickerProps): JSX.Element {
  const {
    children,
    defaultValue = undefined,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = props;

  const colorChange = async (color: DHCColor) => {
    if (color === undefined) {
      return;
    }

    const hex = color.toString('hex');
    propOnChange(hex);
  };

  const [value, onChange] = useDebouncedOnChange(
    propValue ?? defaultValue,
    colorChange
  );

  if (Array.isArray(children) && children.length === 0) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <DHCColorPicker value={value} onChange={onChange} {...otherProps}>
        <DHCColorEditor />
      </DHCColorPicker>
    );
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCColorPicker {...otherProps}>{children}</DHCColorPicker>
  );
}

export default ColorPicker;
