import { useLayoutEffect, useState } from 'react';

/**
 * Position a fixed-position popover so its top-right corner is anchored
 * just below the anchor element. Flips above the anchor when the
 * preferred placement would fall off the bottom of the viewport.
 */
export default function usePortalAnchorPosition(
  anchorRef: React.RefObject<HTMLElement>,
  popoverRef: React.RefObject<HTMLElement>
): { top: number; right: number } | null {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  useLayoutEffect(() => {
    const a = anchorRef.current;
    const p = popoverRef.current;
    if (a == null) return undefined;
    const compute = (): void => {
      const r = a.getBoundingClientRect();
      const ph = p?.getBoundingClientRect().height ?? 0;
      const gap = 4;
      const wantTop = r.bottom + gap;
      const overflowsBottom = wantTop + ph > window.innerHeight - 8;
      const top = overflowsBottom ? Math.max(8, r.top - gap - ph) : wantTop;
      const right = window.innerWidth - r.right;
      setPos({ top, right });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [anchorRef, popoverRef]);
  return pos;
}
