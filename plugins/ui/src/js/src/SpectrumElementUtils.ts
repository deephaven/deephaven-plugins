import {
  Content,
  Flex,
  Grid,
  Heading,
  Icon,
  IllustratedMessage,
  Text,
  View,
} from '@adobe/react-spectrum';
import { ValueOf } from '@deephaven/utils';
import { RenderedNode, isRenderedNode } from './ElementUtils';

export const SPECTRUM_ELEMENT_TYPE_PREFIX = 'deephaven.ui.spectrum.';

export const SpectrumSupportedTypes = {
  Content,
  Flex,
  Grid,
  Heading,
  Icon,
  IllustratedMessage,
  Text,
  View,
} as const;

export type SpectrumElementName =
  `${typeof SPECTRUM_ELEMENT_TYPE_PREFIX}${keyof typeof SpectrumSupportedTypes}`;

export type SpectrumElementNode = RenderedNode & {
  name: SpectrumElementName;
};

export function isSpectrumElementNode(
  obj: unknown
): obj is SpectrumElementNode {
  return (
    isRenderedNode(obj) &&
    (obj as SpectrumElementNode).name.startsWith(SPECTRUM_ELEMENT_TYPE_PREFIX)
  );
}

/**
 * Get the Spectrum Component for the element
 * @param name Name of the element
 * @returns The Spectrum Component name for the element
 */
export function getSpectrumComponent(
  name: SpectrumElementName
): ValueOf<typeof SpectrumSupportedTypes> {
  return SpectrumSupportedTypes[
    name.substring(
      SPECTRUM_ELEMENT_TYPE_PREFIX.length
    ) as keyof typeof SpectrumSupportedTypes
  ];
}
