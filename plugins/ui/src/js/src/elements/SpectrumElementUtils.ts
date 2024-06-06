import { ValueOf } from '@deephaven/utils';
import {
  ButtonGroup,
  Content,
  ContextualHelp,
  Grid,
  Heading,
  Icon,
  Item,
  IllustratedMessage,
  NumberField,
  SpectrumCheckbox as Checkbox,
  Switch,
  Tabs,
  TabList,
  Text,
  ToggleButton,
  Flex,
  View,
} from '@deephaven/components';
import {
  ActionButton,
  Button,
  Form,
  RangeSlider,
  Slider,
  TabPanels,
  TextField,
} from './spectrum';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

// TODO: #425 will be removing Spectrum utils altogether. Just keeping this for
// now to keep the initial PR smaller.
export const SPECTRUM_ELEMENT_TYPE_PREFIX = 'deephaven.ui.components.';

export const SpectrumSupportedTypes = {
  ActionButton,
  Button,
  ButtonGroup,
  Checkbox,
  Content,
  ContextualHelp,
  Flex,
  Form,
  Grid,
  Heading,
  Icon,
  IllustratedMessage,
  NumberField,
  RangeSlider,
  Slider,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Text,
  TextField,
  ToggleButton,
  View,
} as const;

export type SpectrumElementName =
  `${typeof SPECTRUM_ELEMENT_TYPE_PREFIX}${keyof typeof SpectrumSupportedTypes}`;

/**
 * Describes a Spectrum element that can be rendered in the UI.
 * The type of Spectrum element loaded is the name of the element without the prefix.
 * For example, `deephaven.ui.spectrum.Text` will render the Text component.
 * The props are passed directly to the Spectrum component.
 * @see SpectrumSupportedTypes
 */
export type SpectrumElementNode = ElementNode<SpectrumElementName>;

export function isSpectrumElementNode(
  obj: unknown
): obj is SpectrumElementNode {
  if (!isElementNode(obj)) {
    return false;
  }

  const name = (obj as SpectrumElementNode)[ELEMENT_KEY];

  return (
    name.startsWith(SPECTRUM_ELEMENT_TYPE_PREFIX) &&
    name.substring(SPECTRUM_ELEMENT_TYPE_PREFIX.length) in
      SpectrumSupportedTypes
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
  const Component =
    SpectrumSupportedTypes[
      name.substring(
        SPECTRUM_ELEMENT_TYPE_PREFIX.length
      ) as keyof typeof SpectrumSupportedTypes
    ];

  if (Component == null) {
    throw new Error(`Unknown Spectrum component '${name}'`);
  }

  return Component;
}
