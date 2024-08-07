import {
  Image as DHCImage,
  ImageProps as DHCImageProps,
} from '@deephaven/components';

type SerializedImageProps = Omit<DHCImageProps, 'onLoad' | 'onError'> & {
  /** Handler that is called when the element receives focus. */
  onLoad?: () => void;

  /** Handler that is called when the element loses focus. */
  onError?: () => void;
};

export function Image({ ...props }: SerializedImageProps): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCImage {...props} />;
}

export default Image;
