import { PropsWithChildren } from 'react';
import mapSpectrumChildren from './mapSpectrumChildren';

/**
 * Map the children of an element to Spectrum children, automatically wrapping strings and numbers in `Text` elements.
 * @param children Children to map as spectrum children
 */
export function mapSpectrumProps<
  T extends PropsWithChildren<Record<string, unknown>>
>(props: T): T {
  return {
    ...props,
    children:
      props?.children != null ? mapSpectrumChildren(props.children) : undefined,
  };
}

export default mapSpectrumChildren;
