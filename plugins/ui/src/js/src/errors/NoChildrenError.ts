export class NoChildrenError extends Error {
  isNoChildrenError = true;
}

export function isNoChildrenError(error: unknown): error is NoChildrenError {
  return (
    error != null &&
    typeof error === 'object' &&
    (error as NoChildrenError).isNoChildrenError === true
  );
}

export default NoChildrenError;
