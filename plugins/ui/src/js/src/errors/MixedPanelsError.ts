export class MixedPanelsError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = 'MixedPanelsError';
  }

  isMixedPanelsError = true;
}

export function isMixedPanelsError(error: unknown): error is MixedPanelsError {
  return error instanceof MixedPanelsError;
}

export default MixedPanelsError;
