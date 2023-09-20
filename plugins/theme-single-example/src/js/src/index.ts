import styleContent from './theme_single.scss?inline';

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

const plugin: ThemePlugin = {
  name: 'Single Theme Plugin',
  type: 'ThemePlugin',
  themes: {
    name: 'Single Dark',
    baseTheme: 'dark',
    styleContent,
  },
};

export default plugin;
