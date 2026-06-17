import { createPanelMiddleware } from '@deephaven/plugin';
import { exampleMiddlewareBody } from './exampleMiddlewareBody';

/**
 * Middleware for the panel path (the `IrisGridPanel` host and similar). Built
 * with `createPanelMiddleware`, which owns the `forwardRef` ceremony and
 * forwards golden-layout's panel ref down to the wrapped panel so its React
 * state (sorts, filters, column moves, etc.) is still persisted into
 * `componentState`. The shared body hook decides what to inject and how to
 * wrap; it never touches the ref.
 */
export const ExamplePanelMiddleware = createPanelMiddleware(
  exampleMiddlewareBody,
  'ExamplePanelMiddleware'
);

export default ExamplePanelMiddleware;
