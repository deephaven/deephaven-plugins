import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SearchInput } from '@deephaven/components';
import usePortalAnchorPosition from './usePortalAnchorPosition';

type PickerProps = {
  anchorRef: React.RefObject<HTMLElement>;
  available: readonly string[];
  excluded: readonly string[];
  placeholder?: string;
  onPick: (name: string) => void;
  onClose: () => void;
};

export default function ColumnPicker({
  anchorRef,
  available,
  excluded,
  placeholder = 'Find column...',
  onPick,
  onClose,
}: PickerProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<SearchInput>(null);
  const excludedSet = useMemo(() => new Set(excluded), [excluded]);
  const pos = usePortalAnchorPosition(anchorRef, containerRef);

  useEffect(() => {
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter(
      c => !excludedSet.has(c) && (q === '' || c.toLowerCase().includes(q))
    );
  }, [available, excludedSet, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, filtered.length]);

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
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = filtered[activeIndex];
        if (pick != null) onPick(pick);
      }
    },
    [activeIndex, filtered, onPick]
  );

  return createPortal(
    <div
      ref={containerRef}
      className="pivot-popover"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        right: pos?.right ?? 0,
        visibility: pos == null ? 'hidden' : 'visible',
      }}
      role="dialog"
    >
      <div className="pivot-popover-search">
        <SearchInput
          ref={searchRef}
          value={query}
          placeholder={placeholder}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="pivot-popover-list" role="listbox">
        {filtered.length === 0 ? (
          <div className="pivot-popover-empty">No options</div>
        ) : (
          filtered.map((name, i) => (
            // eslint-disable-next-line jsx-a11y/interactive-supports-focus
            <div
              key={name}
              role="option"
              aria-selected={i === activeIndex}
              className={`pivot-popover-item${
                i === activeIndex ? ' pivot-popover-item--active' : ''
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={e => {
                e.preventDefault();
                onPick(name);
              }}
            >
              {name}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
