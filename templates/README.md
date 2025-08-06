# Deephaven Plugin Templates

This repository contains templates for creating Deephaven plugins.
In order to use these templates, you must have [cookiecutter](https://cookiecutter.readthedocs.io/en/latest/) installed.

There are two main ways to use these templates.
If you have this repository locally, you can run the following command from where you want to create your plugin:
```sh
cookiecutter <path/to/deephaven-plugins>/templates/<template name>
```

If you don't have this repository locally, you can run the following command:
```sh
cookiecutter gh:deephaven/deephaven-plugins --directory="templates/<template name>"
```

Currently, we offer two templates for creating plugins.
The element plugin is recommended for almost all use cases as it is much easier to use and requires less boilerplate code.
Use the widget plugin only if you must have full control over the messages sent between the client and server.

## element

This creates a basic element plugin for Deephaven.
An element plugin extends `deephaven.ui` with custom React components.
This template is recommended if you can use `deephaven.ui` and do not need full control over messaging.
Because element plugins are built on top of `deephaven.ui`, they are easier to use and require less boilerplate code than bidirectional widget plugins.

## widget

This creates a basic bidirectional widget plugin for Deephaven.
A bidirectional plugin can send and receive messages on both the client and server.
This template is recommended only if you must have full control over the messages sent between the client and server.
Widget plugins must manage their own messaging implementation, as only basic methods for sending messages between the client and server are provided.