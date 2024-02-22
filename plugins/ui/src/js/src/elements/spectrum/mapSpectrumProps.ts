import { PropsWithChildren } from 'react';
import mapSpectrumChildren from './mapSpectrumChildren';

/**
 * Map the props of an element to Spectrum props, automatically wrapping children strings and numbers in `Text` elements.
 * @param props Props to map as spectrum props
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
