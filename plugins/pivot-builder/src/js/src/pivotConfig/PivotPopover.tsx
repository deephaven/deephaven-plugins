import { useRef } from 'react';
import { createPortal } from 'react-dom';
import usePortalAnchorPosition from './usePortalAnchorPosition';
import useDismissablePopover from './useDismissablePopover';

type PivotPopoverProps = {
  /** Element the popover is positioned against (top-right, below it). */
  anchorRef: React.RefObject<HTMLElement>;
  /** Called on outside mousedown or Escape. */
  onClose: () => void;
  /** Extra class appended to the base `pivot-popover` class. */
  className?: string;
  children: React.ReactNode;
};

/**
 * Portal-rendered popover anchored to `anchorRef`, dismissed on outside
 * click / Escape. Owns the container ref, viewport positioning, and dismiss
 * wiring so callers only supply their content.
 */
export default function PivotPopover({
  anchorRef,
  onClose,
  className,
  children,
}: PivotPopoverProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const pos = usePortalAnchorPosition(anchorRef, containerRef);
  useDismissablePopover(containerRef, onClose);
  return createPortal(
    <div
      ref={containerRef}
      className={
        className == null ? 'pivot-popover' : `pivot-popover ${className}`
      }
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        right: pos?.right ?? 0,
        visibility: pos == null ? 'hidden' : 'visible',
      }}
      role="dialog"
    >
      {children}
    </div>,
    document.body
  );
}
