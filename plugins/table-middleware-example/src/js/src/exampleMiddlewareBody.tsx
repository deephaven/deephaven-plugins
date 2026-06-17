import type { MiddlewareBody } from '@deephaven/plugin';
import Log from '@deephaven/log';
import { ExampleMiddlewareContext } from './ExampleMiddlewareContext';

const log = Log.module('ExampleMiddleware');

/**
 * The single shared body of the example middleware. Both the widget path
 * (`createWidgetMiddleware`) and the panel path (`createPanelMiddleware`) reuse
 * this one hook, so the plugin expresses its behavior exactly once.
 *
 * It demonstrates the two things a middleware can do to the next component in
 * the chain, with no coupling to any specific widget type (e.g. IrisGrid):
 *
 * 1. `inject` — merge extra props onto the wrapped `Component`. Here we add a
 *    single `exampleInjectedProp`. The wrapped component receives it alongside
 *    its normal props; a widget that knows to read it can use it, and any that
 *    doesn't simply ignores it.
 * 2. `wrap` — render a wrapper *around* the wrapped component. Here we provide
 *    an `ExampleMiddlewareContext` so descendants can read what the middleware
 *    contributed, plus a small banner so the wrapping is visible in the UI.
 *
 * The body never sees (and cannot drop) the panel ref — the factory forwards it
 * for us, keeping golden-layout state persistence intact.
 */
export const exampleMiddlewareBody: MiddlewareBody<{
  metadata?: { name?: string };
}> = props => {
  log.debug('Middleware in chain. Incoming widget metadata:', props.metadata);

  return {
    // Extra prop threaded down to the next component in the chain.
    inject: {
      exampleInjectedProp: 'Hello from the example middleware!',
    },
    // Wrapper placed around the next component: a context provider + banner.
    wrap: child => (
      <ExampleMiddlewareContext.Provider
        value={{ label: '@deephaven/js-plugin-table-middleware-example' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <div
            style={{
              flex: '0 0 auto',
              padding: '4px 8px',
              fontSize: '12px',
              opacity: 0.7,
              borderBottom: '1px solid var(--dh-color-border, #3b3b3b)',
            }}
          >
            Wrapped by example middleware
          </div>
          <div style={{ flex: '1 1 auto', minHeight: 0 }}>{child}</div>
        </div>
      </ExampleMiddlewareContext.Provider>
    ),
  };
};

export default exampleMiddlewareBody;
