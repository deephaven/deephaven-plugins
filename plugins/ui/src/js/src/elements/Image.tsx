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
  return (
    <DHCImage
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      // React Spectrum doesn't allow us to directly set the crossorigin attribute in this version
      // so we use a ref to set it on the underlying img element.
      // Spectrum will support once this PR is released: https://github.com/adobe/react-spectrum/pull/8532
      // For now, just assume we want everything to be anonymous, as images are often loaded from a different origin.
      ref={imageNode =>
        imageNode
          ?.UNSAFE_getDOMNode()
          ?.querySelector('img')
          ?.setAttribute('crossorigin', 'anonymous')
      }
    />
  );
}

export default Image;
