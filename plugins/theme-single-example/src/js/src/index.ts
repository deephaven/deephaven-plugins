import styleContent from './theme_purple.scss?inline';

/** TODO: Define these types in @deephaven/plugin */

interface ThemePluginConfig {
  name: string;
  baseTheme: 'dark' | 'light';
  styleContent: string;
}

interface ThemePlugin {
  name: string;
  type: 'ThemePlugin';
  themes: ThemePluginConfig | ThemePluginConfig[];
}

/** Plugin */

export const plugin: ThemePlugin = {
  name: 'Delta Theme Plugin',
  type: 'ThemePlugin',
  themes: {
    name: 'Delta Purple',
    baseTheme: 'dark',
    styleContent,
  },
};

export default plugin;
