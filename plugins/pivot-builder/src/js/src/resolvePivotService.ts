import type { dh as DhType } from '@deephaven/jsapi-types';

/**
 * Finds a single worker variable by predicate, optionally scoped by a routing
 * descriptor, resolving to the first match or `null` if none is present.
 * Declared structurally here (rather than imported from
 * `@deephaven/jsapi-bootstrap`) so the plugin type-checks against host versions
 * that predate the `useVariableDefinitionFinder` hook; the runtime value is
 * supplied by the host when available.
 */
export type VariableDefinitionFinder = (
  predicate: (definition: DhType.ide.VariableDefinition) => boolean,
  descriptor?: DhType.ide.VariableDescriptor
) => Promise<DhType.ide.VariableDefinition | null>;

/** The variable type the CorePlus pivot service is published under. */
export const PIVOT_SERVICE_TYPE = 'PivotService';

/**
 * Build a PivotService descriptor that fetches by `name` only.
 *
 * The source panel metadata may carry an `id` (and a source `name`) that
 * identify the *table* the user is pivoting, not the PivotService. The server
 * rejects a descriptor that has *both* `name` and `id`
 * ("has both name and id field; could not getObject"), and even after
 * sanitizing, an `id` takes precedence over `name`, resolving the wrong object.
 * So we drop both `id` and the source `name`, keep only the routing keys
 * (`sessionId` / `querySerial` / `query`) needed for DHE worker targeting, and
 * set the resolved PivotService `name` and `type`.
 */
function withPivotServiceName(
  metadata: DhType.ide.VariableDescriptor,
  name: string
): DhType.ide.VariableDescriptor {
  return {
    ...metadata,
    type: PIVOT_SERVICE_TYPE,
    name,
  } as unknown as DhType.ide.VariableDescriptor;
}

/**
 * Resolve the descriptor used to fetch the worker's PivotService widget.
 *
 * Discovery is delegated entirely to the host variable finder (`findField`),
 * which locates a variable whose `type` is the PivotService, honoring whatever
 * name it was published under. The finder is authoritative: if it is absent
 * (the host predates variable finding) or reports no PivotService variable,
 * this returns `null` (definitively unavailable) so callers can avoid a doomed
 * fetch.
 *
 * @param metadata Panel routing metadata for the worker
 * @param findField Host variable finder, or `null` if unavailable
 * @returns A descriptor to fetch the PivotService widget, or `null` if no
 *          PivotService is available
 */
export async function resolvePivotServiceDescriptor(
  metadata: DhType.ide.VariableDescriptor,
  findField: VariableDefinitionFinder | null
): Promise<DhType.ide.VariableDescriptor | null> {
  if (findField == null) {
    return null;
  }
  const pspField = await findField(
    field => field.type === PIVOT_SERVICE_TYPE,
    metadata
  );
  if (pspField == null) {
    return null;
  }
  return withPivotServiceName(metadata, pspField.name ?? pspField.title);
}

/**
 * Close a fetched PivotService widget and any objects it exported, mirroring
 * the ownership contract of `@deephaven/jsapi-bootstrap`'s `useWidget`: whoever
 * fetches a widget owns it and must close it (and its exported objects) once it
 * is no longer needed. Safe to call with `null`.
 */
export function closePivotServiceWidget(widget: DhType.Widget | null): void {
  if (widget == null) {
    return;
  }
  widget.close();
  if ('exportedObjects' in widget) {
    widget.exportedObjects.forEach(exportedObject => {
      exportedObject.close();
    });
  }
}
