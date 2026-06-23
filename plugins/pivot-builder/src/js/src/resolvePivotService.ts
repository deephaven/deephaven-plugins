import type { dh as DhType } from '@deephaven/jsapi-types';

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
  // Drop the source `id` and `name` so the fetch resolves the PivotService by
  // its own `name` alone. Keeping the source `id` makes the server resolve the
  // wrong object (the table being pivoted), which fails with
  // "No ObjectType found, expected type 'PivotService'". The remaining routing
  // keys (`sessionId` / `querySerial` / `query`) are preserved for DHE worker
  // targeting.
  const {
    id: _id,
    name: _sourceName,
    ...routing
  } = metadata as unknown as Record<string, unknown>;
  return {
    ...routing,
    type: PIVOT_SERVICE_TYPE,
    name,
  } as unknown as DhType.ide.VariableDescriptor;
}

/**
 * Pick the PivotService descriptor from a live worker variable list (the push
 * snapshot exposed by `useWorkerVariables`). Locates the `PivotService` entry
 * by `type` (honoring whatever name it was published under) and pins the
 * resolved name onto the routing metadata. Returns `null` when the list
 * contains no PivotService variable.
 */
export function pickPivotServiceDescriptor(
  metadata: DhType.ide.VariableDescriptor,
  variables: readonly DhType.ide.VariableDefinition[]
): DhType.ide.VariableDescriptor | null {
  const pspField = variables.find(v => v.type === PIVOT_SERVICE_TYPE);
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
