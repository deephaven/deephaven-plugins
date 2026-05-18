import Log from '@deephaven/log';

const log = Log.module('Navigate');

// Event types received from the server
export const NAVIGATE_EVENT = 'navigate.event';

/**
 * Custom event dispatched after Navigate() changes the URL.
 * All WidgetHandlers listen for this to sync URL state to the backend.
 * This doesn't work for navigation triggered outside this plugin, so external
 * code would need to dispatch this event to trigger URL sync for this plugin
 * if it is needed.
 */
export const URL_CHANGED_EVENT = 'deephaven-url-changed';

export type NavigateParams = {
  path?: string | null;
  queryParams?: string | null;
  fragment?: string | null;
  replace?: boolean | null;
};

// Type sent to the server for current location
export const URL_PARAM = '__url';

/** Separator between platform routing and widget routing in the URL */
const WIDGET_PATH_SEPARATOR = '/-/';

/** Allowed URL schemes for navigation */
/** Local routing doesn't have a scheme, but future routing might. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', '']);

/**
 * Get the widget base path from the current URL.
 * This is the portion up to and including `/-/`.
 * If `/-/` is not in the path, returns the full pathname.
 */
function getWidgetBasePath(): string {
  const { pathname } = window.location;
  const separatorIndex = pathname.indexOf(WIDGET_PATH_SEPARATOR);
  if (separatorIndex === -1) {
    return pathname;
  }
  return pathname.substring(0, separatorIndex + WIDGET_PATH_SEPARATOR.length);
}

/**
 * Handle a navigate event by updating the browser URL
 * and pushing or replacing the history entry.
 *
 * @param params The navigate event parameters
 */
export function Navigate(params: NavigateParams): void {
  const {
    path: navPath,
    queryParams: navQueryParams,
    fragment: navFragment,
    replace: navReplace,
  } = params;

  const url = new URL(window.location.href);

  // Handle path
  if (navPath != null) {
    // Sanitize path: strip '..' traversal sequences
    const sanitizedPath = navPath.replace(/(?:^|\/)\.\./g, '');
    const basePath = getWidgetBasePath();
    // If basePath includes /-/, append the new path after it
    if (basePath.includes(WIDGET_PATH_SEPARATOR)) {
      url.pathname = basePath + sanitizedPath.replace(/^\//, '');
    } else {
      // No /-/ boundary yet — establish it
      url.pathname =
        basePath.replace(/\/$/, '') +
        WIDGET_PATH_SEPARATOR +
        sanitizedPath.replace(/^\//, '');
    }
  }

  // Handle query params: null/undefined = preserve (or clear if path changed), "" = clear
  // Query params are cleared if a new path is provided without explicit query params as it is assumed they are not relevant.
  if (navQueryParams != null) {
    url.search = navQueryParams;
  } else if (navPath != null) {
    // If a new path is provided without explicit query params, clear them
    url.search = '';
  }

  // Handle fragment: null/undefined = preserve (or clear if path changed), "" = clear
  // Fragments are cleared if a new path is provided without an explicit fragment as it is assumed it is not relevant.
  if (navFragment != null) {
    url.hash = navFragment ? `#${navFragment}` : '';
  } else if (navPath != null) {
    // If a new path is provided without explicit fragment, clear it
    url.hash = '';
  }

  // Security: reject cross-origin navigation
  if (url.origin !== window.location.origin) {
    log.warn('Blocked cross-origin navigation attempt to', url.origin);
    return;
  }

  // Security: reject dangerous schemes
  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    log.warn('Blocked navigation with disallowed scheme:', url.protocol);
    return;
  }

  const shouldReplace = navReplace ?? true;
  const newUrl = url.pathname + url.search + url.hash;
  if (shouldReplace) {
    window.history.replaceState(null, '', newUrl);
  } else {
    window.history.pushState(null, '', newUrl);
  }

  // Notify all WidgetHandlers that the URL changed so they can sync state.
  // Uses a custom event (not popstate) to avoid interfering with browser navigation.
  window.dispatchEvent(new Event(URL_CHANGED_EVENT));
}

export default Navigate;
