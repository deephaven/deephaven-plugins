import { createContext } from 'react';

/** Error status of the widget within this context */
export const WidgetErrorContext = createContext<unknown | null>(null);

export default WidgetErrorContext;
