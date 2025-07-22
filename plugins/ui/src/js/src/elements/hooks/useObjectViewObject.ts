import { ReactNode } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { isElementOfType } from '@deephaven/react-hooks';
import ObjectView from '../ObjectView';
import UriObjectView from '../UriObjectView';
import useExportedObject, { ResolvedExportedObject } from './useExportedObject';

/**
 * Hook to fetch the object and JS API from an ObjectView or UriObjectView.
 * If the node is not an ObjectView or UriObjectView, it returns null.
 * @param node The ReactNode to check and fetch the table from.
 * @returns The fetched table or null if not applicable.
 */
export function useObjectViewObject<T = dh.Widget>(
  node: ReactNode
): ResolvedExportedObject<T> {
  const maybeObjectView = isElementOfType(node, ObjectView)
    ? node.props.object
    : null;
  const maybeUriObjectView = isElementOfType(node, UriObjectView)
    ? node.props.uri
    : '';

  const exportedObject = useExportedObject<T>(
    maybeObjectView || maybeUriObjectView
  );

  return exportedObject;
}

export default useObjectViewObject;
