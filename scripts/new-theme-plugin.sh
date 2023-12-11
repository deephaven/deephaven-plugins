plugin_name=$1
theme_name=$2

if ["$plugin_name" == ""]; then
    read -p "Plugin name? (default: sample-theme-plugin): " plugin_name
    plugin_name=${plugin_name:-"sample-theme-plugin"}
fi

if ["$theme_name" == ""]; then
    read -p "Theme name? (default: Sample Theme): " theme_name
    theme_name=${theme_name:-"Sample Theme"}
fi

workspace_root=$(pwd)
plugin_root="$workspace_root/plugins/$plugin_name/src/js"

echo "Creating new theme plugin: $plugin_name..."

# Scafold plugin

mkdir -p $plugin_root
cd $plugin_root

npm create vite@latest . -- --template vanilla-ts > /dev/null
npm pkg set name="$plugin_name" scripts.start='npm run build -- -w'

# Remove unnecessary files
rm -rf public
rm index.html
rm src/counter.ts
rm src/main.ts
rm src/style.css
rm src/typescript.svg

# Create files

cat > src/theme.scss << EOF
:root {
  /* Example: swap fg and bg colors */
  --dh-color-bg-hsl: var(--dh-color-white-hsl);
  --dh-color-fg-hsl: var(--dh-color-black-hsl);
}
EOF

cat > src/index.ts << EOF
import type { ThemePlugin } from '@deephaven/plugin';
import styleContent from './theme.scss?inline';

export const plugin: ThemePlugin = {
  name: '$plugin_name',
  type: 'ThemePlugin',
  themes: {
    name: '$theme_name',
    baseTheme: 'dark',
    styleContent,
  },
};

export default plugin;
EOF

cat > vite.config.ts << EOF
/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    minify: false,
    lib: {
      entry: './src/index.ts',
      fileName: () => 'index.js',
      formats: ['cjs'],
    },
  },
}));
EOF

cd $workspace_root
./node_modules/.bin/lerna add -D @deephaven/plugin  --scope=$plugin_name

echo "Created new theme plugin: $plugin_name."
echo -e '\nTo use your new theme, add the following entry to plugins/manifest.json:\n'
echo "{ \"name\": \""$plugin_name"\", \"version\": \"0.1.0\", \"main\": \"src/js/dist/index.js\" }"
echo ""