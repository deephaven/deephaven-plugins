import { ReactElement } from 'react';
import {
  ListViewProps as DHListViewProps,
  SelectionMode,
} from '@deephaven/components';
import { ListViewProps as DHListViewJSApiProps } from '@deephaven/jsapi-components';
import ObjectView, { ObjectViewProps } from '../ObjectView';
import {
  SerializedSelectionProps,
  useSelectionProps,
} from './useSelectionProps';

type Density = Required<DHListViewProps>['density'];

type WrappedDHListViewJSApiProps = Omit<DHListViewJSApiProps, 'table'> & {
  children: ReactElement<ObjectViewProps, typeof ObjectView>;
};

type WrappedDHListViewProps = Omit<
  DHListViewProps,
  'density' | 'selectionMode'
> & {
  // The dh UI spec specifies that density and selectionMode should be uppercase,
  // but the Spectrum props are lowercase. We'll accept either to keep things
  // more flexible.
  density?: Density | Uppercase<Density>;
  selectionMode?: SelectionMode | Uppercase<SelectionMode>;
};

export type SerializedListViewProps = (
  | WrappedDHListViewProps
  | WrappedDHListViewJSApiProps
) &
  SerializedSelectionProps;

/**
 * Wrap ListView props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useListViewProps({
  density: densityMaybeUppercase,
  selectionMode: selectionModeMaybeUppercase,
  onChange: serializedOnChange,
  onSelectionChange: serializedOnSelectionChange,
  children,
  renderEmptyState,
  ...otherProps
}: SerializedListViewProps): DHListViewProps | WrappedDHListViewJSApiProps {
  const densityLc = densityMaybeUppercase?.toLowerCase() as Density | undefined;

  const { selectionMode, onChange, onSelectionChange } = useSelectionProps({
    selectionMode: selectionModeMaybeUppercase,
    onChange: serializedOnChange,
    onSelectionChange: serializedOnSelectionChange,
  });

  return {
    density: densityLc,
    selectionMode,
    onChange,
    onSelectionChange,
    children: (children == null ? [] : children) as ReactElement<
      ObjectViewProps,
      typeof ObjectView
    >,
    renderEmptyState:
      renderEmptyState &&
      ((() => renderEmptyState) as unknown as () => JSX.Element),
    // The @deephaven/components `ListView` has its own normalization logic that
    // handles primitive children types (string, number, boolean). It also
    // handles nested children inside of `Item` and `Section` components, so
    // we are intentionally not wrapping `otherProps` in `mapSpectrumProps`
    ...otherProps,
  };
}
