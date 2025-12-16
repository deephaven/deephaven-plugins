import type { ThemePlugin } from '@deephaven/plugin';
import styleContent from './theme.css?inline';

const plugin: ThemePlugin = {
  name: 'theme-pack', // match the plugin name in the package.json, and the folder name
  type: 'ThemePlugin',
  themes: {
    name: 'FT Theme', // A human-readable name for the theme
    baseTheme: 'light', // The base theme to extend from, either 'light' or 'dark'
    styleContent, // this is a string containing your .css file contents, you could also manually inline css rules here
  },
};

export default plugin;
