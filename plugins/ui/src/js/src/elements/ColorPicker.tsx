import {
  ColorPicker as DHCColorPicker,
  ColorPickerProps as DHCColorPickerProps,
  ColorEditor as DHCColorEditor,
  ColorEditorProps as DHCColorEditorProps,
} from '@deephaven/components';

export function ColorPicker(props: DHCColorPickerProps): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCColorPicker {...props}>
      <DHCColorEditor />
    </DHCColorPicker>
  );
}

export default ColorPicker;
