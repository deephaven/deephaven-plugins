import { useEffect } from 'react';

/**
 * Dismiss a popover on outside mousedown or the Escape key. `containerRef`
 * must point at the popover's root element; clicks inside it are ignored.
 */
export default function useDismissablePopover(
  containerRef: React.RefObject<HTMLElement>,
  onClose: () => void
): void {
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        containerRef.current != null &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [containerRef, onClose]);
}
