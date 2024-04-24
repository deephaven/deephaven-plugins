# Deephaven JavaScript Module Plugin Template

Use this Template to create a JavaScript Plugin. It is set up with TypeScript, React, ESLint, Prettier, sass, and image loader. Use this template as a starting point for creating new Deephaven JavaScript Module Plugins. Each JavaScript module may or may not include different plugin types, such as a `DashboardPlugin` or a `TablePlugin`.

## Initial Setup

After checking out this template for the first time:

1. Do an `npm install`

## Build the Plugin

```bash
npm run build
```

Your output will be in `dist/index.js`

## Source Files

Your main source file is `src/index.ts`. From this file, export the plugin types you want to register. For example, you can export a `DashboardPlugin` and a `TablePlugin` from this file.

## Installing the Plugin Module

### Development Installation

In development, run `npm start` to start a local build that watches for changes. Anytime you make a change to the source code, your build will update. 
You'll then need to define a `manifest.json` in the parent directory, using the name of this directory as the name of the plugin. For example, a proper manifest would be:
```json
{
  "plugins": [{ "name": "deephaven-js-plugin-template", "version": "0.0.1", "main": "dist/index.js" }]
}
``` 
You can then start up Deephaven using [the parent directory with the manifest.json file as the plugin directory](https://deephaven.io/core/docs/how-to-guides/configuration/js-plugins/#configuration):

```bash
START_OPTS="-Ddeephaven.jsPlugins.resourceBase=/path/to/manifest/directory" ./gradlew server-jetty-app:run
```

Then, refresh your browser after making changes to the source code to see your changes.

### Production Installation

In production, you need to publish your plugin:

- [Publish your package](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages): You'll need to publish your package so it can be installed in a production Deephaven environment.
- [Install the package](https://deephaven.io/core/docs/how-to-guides/configuration/js-plugins/#examples): After the plugin is published, you install the plugin in your Docker image so it can be used.

## Plugin Types

A module can optionally export one or more of the following types of plugins.

### Dashboard Plugin (`DashboardPlugin`)

Export a `DashboardPlugin` from the module to register a Dashboard Plugin. Dashboard Plugins can listen for and emit events on a Dashboard, register their own type of components for display in a Dashboard, and display their own UI overtop of a Dashboard.

### Table Plugin (`TablePlugin`)

Set the `PLUGIN_NAME` attribute on the Table with the name of the plugin.

```python
from deephaven import empty_table

t = empty_table(5).update("X=i")
t = t.with_attributes({"PluginName": "deephaven-js-plugin-template"})
```

### Authentication Plugin (`AuthenticationPlugin`)

Export an `AuthenticationPlugin` from the module to register an Authentication Plugin. Authentication Plugins can provide a UI for authenticating users and provide credentials when connecting to the Deephaven server.

For some examples of the core Authentication Plugins, see the [@deephaven/auth-plugins](https://github.com/deephaven/web-client-ui/tree/main/packages/auth-plugins/src) package. This package includes plugins for anonymous, pre-shared key, and parent window authentication.

For a complete example of an Authentication Plugin that authenticates using Keycloak, see the [@deephaven/auth-keycloak](https://github.com/deephaven/deephaven-js-plugins/tree/main/plugins/auth-keycloak) repository.
