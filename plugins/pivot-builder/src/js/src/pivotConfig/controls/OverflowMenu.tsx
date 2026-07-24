/* eslint-disable react-refresh/only-export-components */
import {
  ActionButton,
  Icon,
  Item,
  Keyboard,
  MenuTrigger,
  Section,
  SpectrumMenu,
  Text,
  ReactFontAwesome,
} from '@deephaven/components';
import { vsBlank, vsCheck, vsKebabVertical } from '@deephaven/icons';

const { FontAwesomeIcon } = ReactFontAwesome;

export type OverflowMenuItem = {
  /** Stable key identifying the item; passed back to `onAction`. */
  key: string;
  /** Visible label. */
  label: string;
  /**
   * Toggle state. When `true` the item shows a leading checkmark; when `false`
   * the checkmark column is blank. When `undefined` the item is a plain action
   * (also blank), so toggles and actions can be mixed in the same menu. Every
   * item reserves the leading icon column so labels stay aligned.
   */
  isSelected?: boolean;
  /**
   * Optional keyboard-shortcut hint, shown right-aligned in the menu row via
   * Spectrum's `Keyboard` element (matching the Organize Columns menu).
   */
  shortcut?: string;
};

/**
 * A group of {@link OverflowMenuItem}s. Spectrum draws a divider before every
 * section after the first, so each section boundary renders a separator —
 * mirroring the grouped "Organize Columns" overflow menu in
 * `@deephaven/iris-grid`.
 */
export type OverflowMenuSection = {
  /** Stable key identifying the section. */
  key: string;
  /** Items rendered within the section. */
  items: OverflowMenuItem[];
};

type OverflowMenuProps = {
  /**
   * Sections rendered in the menu, with a separator drawn between each.
   * Memoize for a stable reference.
   */
  sections: OverflowMenuSection[];
  /** Keys of items rendered as disabled. */
  disabledKeys?: Iterable<string>;
  /** Accessible label / tooltip for the kebab (⋮) trigger. */
  tooltip: string;
  /** Invoked with the key of the activated item. */
  onAction: (key: string) => void;
  /** Invoked when the menu opens (e.g. to dismiss other open popovers). */
  onOpen?: () => void;
};

/**
 * A kebab (⋮) button that opens a Spectrum `Menu`, mirroring the Organize
 * Columns overflow menu in `@deephaven/iris-grid`. `MenuTrigger` owns the
 * open/close state. Items may be plain actions or checkable toggles
 * (`isSelected` defined): a toggle's leading checkmark is swapped between
 * `vsCheck` and `vsBlank` via `FontAwesomeIcon`, exactly like the
 * "Show hidden columns" item there.
 */
export default function OverflowMenu({
  sections,
  disabledKeys,
  tooltip,
  onAction,
  onOpen,
}: OverflowMenuProps): JSX.Element {
  return (
    <MenuTrigger
      closeOnSelect
      onOpenChange={isOpen => {
        if (isOpen) {
          onOpen?.();
        }
      }}
    >
      <ActionButton isQuiet aria-label={tooltip}>
        <FontAwesomeIcon icon={vsKebabVertical} />
      </ActionButton>
      <SpectrumMenu
        disabledKeys={disabledKeys}
        onAction={key => onAction(String(key))}
      >
        {sections.map(section => (
          <Section key={section.key}>
            {section.items.map(item => (
              <Item key={item.key} textValue={item.label}>
                <Icon>
                  <FontAwesomeIcon
                    icon={item.isSelected === true ? vsCheck : vsBlank}
                  />
                </Icon>
                <Text>{item.label}</Text>
                {item.shortcut != null && <Keyboard>{item.shortcut}</Keyboard>}
              </Item>
            ))}
          </Section>
        ))}
      </SpectrumMenu>
    </MenuTrigger>
  );
}
