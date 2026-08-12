import { useEffect, useState } from 'react';
import { Popper, type ReferenceObject } from '@deephaven/components';

type PivotPopoverProps = {
  /** Element the popover is positioned against (below it, right-aligned). */
  anchorRef: React.RefObject<HTMLElement>;
  /** Called on outside click or Escape (after the close transition). */
  onClose: () => void;
  /**
   * Called once the open transition finishes. `Popper` focuses its own
   * container when it opens, so callers that want to focus an inner control
   * (e.g. a search field) must do it here to win that race.
   */
  onOpen?: () => void;
  /** Extra class appended to the base `pivot-popover` class. */
  className?: string;
  children: React.ReactNode;
};

/**
 * Popover anchored to `anchorRef`, built on the shared `@deephaven/components`
 * `Popper` so it inherits the design-system chrome (background, shadow, arrow),
 * Escape handling, and close-on-outside-click. Callers mount this only while
 * the popover is open and supply the content; dismissal is reported through
 * `onClose`.
 */
export default function PivotPopover({
  anchorRef,
  onClose,
  onOpen,
  className,
  children,
}: PivotPopoverProps): JSX.Element {
  // `Popper` opens on an `isShown` false -> true transition (it has no
  // mount-already-shown path), so start hidden and flip to shown once mounted.
  const [isShown, setIsShown] = useState(false);
  useEffect(() => {
    setIsShown(true);
  }, []);

  return (
    <Popper
      isShown={isShown}
      referenceObject={anchorRef.current as ReferenceObject | null}
      options={{ placement: 'bottom-end' }}
      className={
        className == null ? 'pivot-popover' : `pivot-popover ${className}`
      }
      onEntered={onOpen}
      onExited={onClose}
      closeOnBlur
      interactive
      containPortals
    >
      {children}
    </Popper>
  );
}
