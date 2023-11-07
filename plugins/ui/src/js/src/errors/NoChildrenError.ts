export class NoChildrenError extends Error {
  isNoChildrenError = true;
}

export function isNoChildrenError(error: unknown): error is NoChildrenError {
  return error instanceof isNoChildrenError;
}

export default NoChildrenError;
