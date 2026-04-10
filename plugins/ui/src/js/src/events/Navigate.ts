import Log from '@deephaven/log';

const log = Log.module('Navigate');

export const NAVIGATE_EVENT = 'navigate.event';

export type NavigateParams = {
  queryParams?: string | null;
  replace?: boolean | null;
};

/**
 * Handle a navigate event by updating the browser URL query parameters
 * and pushing or replacing the history entry.
 *
 * @param params The navigate event parameters
 */
export function Navigate(params: NavigateParams): void {
  const { queryParams: navQueryParams, replace: navReplace } = params;

  const url = new URL(window.location.href);

  // null/undefined should preserve
  if (navQueryParams != null) {
    url.search = navQueryParams;
  }

  // Security: reject cross-origin navigation
  if (url.origin !== window.location.origin) {
    log.warn('Blocked cross-origin navigation attempt to', url.origin);
    return;
  }

  const shouldReplace = navReplace ?? true;
  const newUrl = url.pathname + url.search + url.hash;
  if (shouldReplace) {
    window.history.replaceState(null, '', newUrl);
  } else {
    window.history.pushState(null, '', newUrl);
  }
}

export default Navigate;
