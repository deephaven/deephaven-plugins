import { useMemo, useRef, useState } from 'react';
import { Item, ListView, SearchInput, Text } from '@deephaven/components';
import PivotPopover from './PivotPopover';

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
  const searchRef = useRef<SearchInput>(null);
  const excludedSet = useMemo(() => new Set(excluded), [excluded]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter(
      c => !excludedSet.has(c) && (q === '' || c.toLowerCase().includes(q))
    );
  }, [available, excludedSet, query]);

  return (
    <PivotPopover
      anchorRef={anchorRef}
      onClose={onClose}
      onOpen={() => searchRef.current?.focus()}
    >
      <div className="pivot-popover-search">
        <SearchInput
          ref={searchRef}
          value={query}
          placeholder={placeholder}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <ListView
        aria-label="Available columns"
        selectionMode="none"
        height="size-3000"
        width="100%"
        onAction={key => onPick(String(key))}
        renderEmptyState={() => <Text>No options</Text>}
      >
        {filtered.map(name => (
          <Item key={name}>{name}</Item>
        ))}
      </ListView>
    </PivotPopover>
  );
}
