import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';

// eslint-disable-next-line import/prefer-default-export
export function isCorePlusDhType(
  api: typeof DhType
): api is typeof CorePlusDhType {
  return (api as typeof CorePlusDhType).coreplus != null;
}
