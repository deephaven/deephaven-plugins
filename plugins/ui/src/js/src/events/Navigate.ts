import Log from '@deephaven/log';

const log = Log.module('Navigate');

// Event types received from the server
export const NAVIGATE_EVENT = 'navigate.event';

export type NavigateParams = {
  path?: string | null;
  queryParams?: string | null;
  fragment?: string | null;
  absolute?: boolean | null;
  replace?: boolean | null;
};

// Types sent to the server for current location
export const QUERY_PARAM = '__queryParams';
export const PATH_PARAM = '__path';
export const ABSOLUTE_PATH_PARAM = '__absolutePath';
export const FRAGMENT_PARAM = '__fragment';
export const HREF_PARAM = '__href';
export const BASE_URL_PARAM = '__baseUrl';

/** The local path prefix that separates platform routing from user routing. */
const LOCAL_PREFIX = '/local/';

/**
 * Extract the relative path after `/local/` from the given pathname.
 * Falls back to "/" if `/local/` is not in the path.
 */
export function getLocalPath(pathname: string): string {
  const idx = pathname.indexOf(LOCAL_PREFIX);
  if (idx === -1) {
    return '/';
  }
  const rel = pathname.substring(idx + LOCAL_PREFIX.length);
  return rel ? `/${rel}` : '/';
}

/**
 * Get the widget base path — everything up to and including `/local/`.
 * If `/local/` is not in the path, returns the full pathname with a trailing slash.
 */
function getWidgetBasePath(pathname: string): string {
  const idx = pathname.indexOf(LOCAL_PREFIX);
  if (idx === -1) {
    const base = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return `${base}local/`;
  }
  return pathname.substring(0, idx + LOCAL_PREFIX.length);
}

// Allowed schemes for navigation
const ALLOWED_SCHEMES = new Set(['http:', 'https:', '']);

/**
 * Handle a navigate event by updating the browser URL and pushing or
 * replacing the history entry.
 *
 * @param params The navigate event parameters
 */
export function Navigate(params: NavigateParams): void {
  const {
    path: navPath,
    queryParams: navQueryParams,
    fragment: navFragment,
    absolute: navAbsolute,
    replace: navReplace,
  } = params;

  const url = new URL(window.location.href);

  // Handle path
  if (navPath != null) {
    if (navAbsolute) {
      // Absolute path — use as-is
      url.pathname = navPath;
    } else {
      // Relative to the widget's /local/ base path
      const basePath = getWidgetBasePath(window.location.pathname);
      const relativePath = navPath.startsWith('/')
        ? navPath.substring(1)
        : navPath;
      url.pathname = basePath + relativePath;
    }
  }

  // Handle query params — null/undefined preserves, "" clears
  if (navQueryParams != null) {
    url.search = navQueryParams;
  }

  // Handle fragment — null/undefined preserves, "" clears
  if (navFragment != null) {
    url.hash = navFragment ? `#${navFragment}` : '';
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

  // Security: sanitize path traversal
  if (url.pathname.includes('..')) {
    log.warn('Blocked path traversal navigation attempt');
    return;
  }

  // Determine replace vs push
  // When replace is null/undefined, auto-determine:
  // - replace when navigating within the widget (absolute=false or within same widget base)
  // - push when navigating outside
  let shouldReplace: boolean;
  if (navReplace != null) {
    shouldReplace = navReplace;
  } else if (!navAbsolute) {
    shouldReplace = true;
  } else {
    // Absolute navigation — check if target is within the current widget base
    const currentBase = getWidgetBasePath(window.location.pathname);
    shouldReplace = url.pathname.startsWith(currentBase);
  }

  const newUrl = url.pathname + url.search + url.hash;
  if (shouldReplace) {
    window.history.replaceState(null, '', newUrl);
  } else {
    window.history.pushState(null, '', newUrl);
  }
}

export default Navigate;
