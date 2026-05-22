import { createContext } from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';

/**
 * Surfaces panel-host info that the sidebar `Create Pivot` page needs in
 * order to build a pivot in-place against an `IrisGridProxyModel` it does
 * not own (panel path). Provided by `PivotBuilderPanelMiddleware`.
 */
export interface PivotBuilderPanelContextValue {
  metadata: DhType.ide.VariableDescriptor | undefined;
}

export const PivotBuilderPanelContext =
  createContext<PivotBuilderPanelContextValue | null>(null);

export default PivotBuilderPanelContext;
