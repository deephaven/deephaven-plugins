import type { ThemePlugin } from '@deephaven/plugin';
import styleContent from './theme.scss?inline';

export const plugin: ThemePlugin = {
  name: 'ft-theme',
  type: 'ThemePlugin',
  themes: {
    name: 'FT Theme',
    baseTheme: 'light',
    styleContent,
  },
};

export default plugin;
