import { useRef } from 'react';
import { ActionButton, Switch } from '@deephaven/components';

type ConfigCardProps = {
  title: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  onAdd: () => void;
  addDisabled?: boolean;
  /** When true, the whole card is greyed-out and non-interactive. */
  disabled?: boolean;
  /**
   * When true, only the per-card on/off Switch is locked; the rest of
   * the card (Add, overflow menu, list edits, drag-and-drop) stays
   * interactive. Used by the global "Toggle" so the user can keep
   * arranging columns without flipping individual card states.
   */
  toggleLocked?: boolean;
  /** When true, render a divider under the title to set off the body. */
  hasBody?: boolean;
  /** Optional overflow (⋮) menu rendered after the Add button. */
  overflow?: React.ReactNode;
  picker?: (anchorRef: React.RefObject<HTMLElement>) => React.ReactNode;
  children: React.ReactNode;
};

export default function ConfigCard({
  title,
  on,
  onToggle,
  onAdd,
  addDisabled,
  disabled,
  toggleLocked,
  hasBody,
  overflow,
  picker,
  children,
}: ConfigCardProps): JSX.Element {
  const buttonRef = useRef<HTMLSpanElement>(null);
  // A card toggled "off" (or hard-disabled) gets a dark, disabled-state
  // border so it reads as inactive while its boundary stays clearly visible.
  // Hard-disabled cards additionally fade out and block all interaction;
  // a merely "off" card stays interactive so its list can still be edited.
  let cardModifier = '';
  if (disabled === true) {
    cardModifier = ' pivot-card--disabled';
  } else if (!on) {
    cardModifier = ' pivot-card--off';
  }
  return (
    <div
      className={`pivot-card${cardModifier}`}
      aria-disabled={disabled === true}
    >
      <div
        className={`pivot-card-header${
          hasBody === true ? ' pivot-card-header--with-body' : ''
        }`}
      >
        <span className="pivot-card-title">{title}</span>
        {/*
          Controlled Spectrum Switch. Guard onChange against echoes:
          react-spectrum can fire onChange during prop-driven internal
          state sync, which — if blindly forwarded — would re-set the
          parent's on/off state to the same value and, in some
          re-render orderings, oscillate the switch. Forwarding only
          when the value actually flips makes the toggle a pure
          user-driven event.
        */}
        <Switch
          isSelected={on}
          onChange={next => {
            if (next !== on) {
              onToggle(next);
            }
          }}
          isDisabled={disabled === true || toggleLocked === true}
          aria-label={title}
        />
        <span ref={buttonRef} className="pivot-add-anchor">
          <ActionButton
            onPress={onAdd}
            isDisabled={addDisabled === true || disabled === true}
          >
            Add
          </ActionButton>
        </span>
        {overflow}
        {picker?.(buttonRef)}
      </div>
      <div
        className={on ? undefined : 'pivot-card-body--off'}
        aria-disabled={!on}
      >
        {children}
      </div>
    </div>
  );
}
