import { createContext } from 'react';

/**
 * Value provided by the example middleware's `wrap`. Any component rendered
 * below the wrapped widget can read this with `useContext` to observe what the
 * middleware contributed. Kept intentionally tiny — a single label — so the
 * example stays focused on the middleware mechanics rather than any specific
 * widget API (there is no IrisGrid coupling here).
 */
export interface ExampleMiddlewareContextValue {
  /** A human-readable label identifying the middleware that wrapped the tree. */
  label: string;
}

export const ExampleMiddlewareContext =
  createContext<ExampleMiddlewareContextValue | null>(null);

export default ExampleMiddlewareContext;
