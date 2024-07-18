export class NestedPanelError extends Error {
  isNestedPanelError = true;
}

export function isNestedPanelError(error: unknown): error is NestedPanelError {
  return error instanceof NestedPanelError;
}

export default NestedPanelError;
