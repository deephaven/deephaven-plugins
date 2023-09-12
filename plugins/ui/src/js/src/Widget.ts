export interface Widget<T = unknown, U = unknown> {
  addEventListener: (type: string, listener: (event: T) => void) => () => void;
  getDataAsBase64(): string;
  getDataAsString(): string;
  sendMessage: (message: string, args: U[]) => void;
  type: string;
}

export default Widget;
