export class NoChildrenError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = 'NoChildrenError';
  }

  isNoChildrenError = true;
}

export function isNoChildrenError(error: unknown): error is NoChildrenError {
  return error instanceof isNoChildrenError;
}

export default NoChildrenError;
