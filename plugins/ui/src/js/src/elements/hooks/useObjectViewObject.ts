import { ReactNode } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { isElementOfType } from '@deephaven/react-hooks';
import { type WidgetTypes } from '@deephaven/jsapi-bootstrap';
import ObjectView from '../ObjectView';
import UriObjectView from '../UriObjectView';
import useExportedObject, { ResolvedExportedObject } from './useExportedObject';
import UriExportedObject from '../../widget/UriExportedObject';

/**
 * Hook to fetch the object and JS API from an ObjectView or UriObjectView.
 * If the node is not an ObjectView or UriObjectView, it throws an error.
 * @param node The ReactNode to check and fetch the table from.
 * @returns The fetched table or null if not applicable.
 */
export function useObjectViewObject<T extends WidgetTypes = dh.Widget>(
  node: ReactNode
): ResolvedExportedObject<T> {
  const maybeObjectView = isElementOfType(node, ObjectView)
    ? node.props.object
    : null;
  const maybeUriObjectView = isElementOfType(node, UriObjectView)
    ? new UriExportedObject(node.props.uri)
    : null;

  const exportedObjectProp = maybeObjectView || maybeUriObjectView;

  if (exportedObjectProp == null) {
    throw new Error(
      'useObjectViewObject must be called with an ObjectView or UriObjectView'
    );
  }

  const exportedObject = useExportedObject<T>(exportedObjectProp);

  return exportedObject;
}

export default useObjectViewObject;
