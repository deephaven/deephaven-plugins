import { createWidgetMiddleware } from '@deephaven/plugin';
import { exampleMiddlewareBody } from './exampleMiddlewareBody';

/**
 * Middleware for the non-panel widget path (e.g. dashboard widgets rendered via
 * `GridWidgetPlugin`). The widget path takes no ref, so this is a plain
 * function component built from the shared body hook.
 */
export const ExampleWidgetMiddleware = createWidgetMiddleware(
  exampleMiddlewareBody,
  'ExampleWidgetMiddleware'
);

export default ExampleWidgetMiddleware;
