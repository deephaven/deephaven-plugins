import { ReactHTML } from 'react';
import type * as icons from '@deephaven/icons';

/** Namespaces */
export const UI_COMPONENTS_NAMESPACE = 'deephaven.ui.components';
export const UI_ELEMENTS_NAMESPACE = 'deephaven.ui.elements';

const uiComponentName = <T extends string>(name: T) =>
  `${UI_COMPONENTS_NAMESPACE}.${name}` as const;

const uiElementName = <T extends string>(name: T) =>
  `${UI_ELEMENTS_NAMESPACE}.${name}` as const;

export const ELEMENT_NAME = {
  /** Elements */
  uiTable: uiElementName('UITable'),

  /** Layout Components */
  column: uiComponentName('Column'),
  dashboard: uiComponentName('Dashboard'),
  panel: uiComponentName('Panel'),
  row: uiComponentName('Row'),
  stack: uiComponentName('Stack'),

  /** Other Components */
  actionButton: uiComponentName('ActionButton'),
  actionGroup: uiComponentName('ActionGroup'),
  actionMenu: uiComponentName('ActionMenu'),
  badge: uiComponentName('Badge'),
  button: uiComponentName('Button'),
  buttonGroup: uiComponentName('ButtonGroup'),
  calendar: uiComponentName('Calendar'),
  checkbox: uiComponentName('Checkbox'),
  checkboxGroup: uiComponentName('CheckboxGroup'),
  comboBox: uiComponentName('ComboBox'),
  content: uiComponentName('Content'),
  contextualHelp: uiComponentName('ContextualHelp'),
  dateField: uiComponentName('DateField'),
  datePicker: uiComponentName('DatePicker'),
  dateRangePicker: uiComponentName('DateRangePicker'),
  dialog: uiComponentName('Dialog'),
  dialogTrigger: uiComponentName('DialogTrigger'),
  flex: uiComponentName('Flex'),
  form: uiComponentName('Form'),
  fragment: uiComponentName('Fragment'),
  grid: uiComponentName('Grid'),
  heading: uiComponentName('Heading'),
  illustratedMessage: uiComponentName('IllustratedMessage'),
  image: uiComponentName('Image'),
  item: uiComponentName('Item'),
  listActionGroup: uiComponentName('ListActionGroup'),
  listActionMenu: uiComponentName('ListActionMenu'),
  link: uiComponentName('Link'),
  listView: uiComponentName('ListView'),
  markdown: uiComponentName('Markdown'),
  numberField: uiComponentName('NumberField'),
  picker: uiComponentName('Picker'),
  progressBar: uiComponentName('ProgressBar'),
  progressCircle: uiComponentName('ProgressCircle'),
  radio: uiComponentName('Radio'),
  radioGroup: uiComponentName('RadioGroup'),
  rangeCalendar: uiComponentName('RangeCalendar'),
  rangeSlider: uiComponentName('RangeSlider'),
  section: uiComponentName('Section'),
  slider: uiComponentName('Slider'),
  switch: uiComponentName('Switch'),
  tabList: uiComponentName('TabList'),
  tabPanels: uiComponentName('TabPanels'),
  tabs: uiComponentName('Tabs'),
  tab: uiComponentName('Tab'),
  text: uiComponentName('Text'),
  textArea: uiComponentName('TextArea'),
  textField: uiComponentName('TextField'),
  timeField: uiComponentName('TimeField'),
  toggleButton: uiComponentName('ToggleButton'),
  view: uiComponentName('View'),
} as const;

export type ElementName = typeof ELEMENT_NAME;

export const ELEMENT_PREFIX = {
  icon: 'deephaven.ui.icons.' as const,
  html: 'deephaven.ui.html.' as const,
};

export type ElementPrefix = {
  icon: `${typeof ELEMENT_PREFIX.icon}${keyof typeof icons}`;
  html: `${typeof ELEMENT_PREFIX.html}${keyof ReactHTML}`;
};
