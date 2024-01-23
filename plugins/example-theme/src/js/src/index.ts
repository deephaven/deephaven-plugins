import type { ThemePlugin } from '@deephaven/plugin';
import styleContent from './theme.scss?inline';

const plugin: ThemePlugin = {
  name: 'example-theme', // match the plugin name in the package.json, and the folder name
  type: 'ThemePlugin',
  themes: {
    name: 'Example Theme', // A human-readable name for the theme
    baseTheme: 'light', // The base theme to extend from, either 'light' or 'dark'
    styleContent,
  },
};

export default plugin;
