import type { IrisGridModel } from '@deephaven/iris-grid';

type ModelEventTarget = {
  addEventListener: (type: string, fn: (e: Event) => void) => void;
  removeEventListener: (type: string, fn: (e: Event) => void) => void;
};

/**
 * Subscribe to a (possibly plugin-defined) event on an `IrisGridModel` and
 * return an unsubscribe callback. The pivot-builder dispatches custom string
 * events (`PIVOT_BUILDER_CONFIG_CHANGED`, `PIVOT_BUILDER_ERROR`) that aren't in
 * `IrisGridModel.EVENT`, and the model uses the dh event shim whose listener
 * type differs from the DOM `Event`; this isolates the required cast in one
 * place (the shim dispatches a standard `CustomEvent` at runtime).
 */
export function addModelListener(
  model: IrisGridModel,
  type: string,
  fn: (e: Event) => void
): () => void {
  const target = model as unknown as ModelEventTarget;
  target.addEventListener(type, fn);
  return () => target.removeEventListener(type, fn);
}

export default addModelListener;
