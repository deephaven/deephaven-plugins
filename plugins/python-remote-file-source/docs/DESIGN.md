# Deephaven Python Remote File Source Plugin

A Deephaven bi-directional plugin to allow sourcing Python imports from the local filesystem. It consists of a Python plugin installed and then instantiated in a Deephaven core / core+ worker. As part of initialization, a custom Python `sys.meta_path` finder and loader will be registered that will send messages to the client to request content for loading modules under a special module root.

## Implementation

### Python

**DeephavenLocalExecPluginObject**

- Deephaven Bi-directional plugin.
- Handles plugin registration + exposes message passing utils
- VS Code extension will use the JS API to run a snippet of Python code to initialize the plugin and assign it to a special variable. e.g.

  ```py
  from deephaven.python_remote_file_source_plugin import PluginObject as DeephavenRemoteFileSourcePlugin

  __deephaven_vscode = DeephavenRemoteFileSourcePlugin()
  ```

- VS Code can then fetch the object and subscribe to messages from the server

**LocalMetaPathFinder class**

- Instantiated with a "root" module name (e.g. `vscode`) defining the scope of module paths it will handle. e.g. A root of `vscode` would handle `vscode.module_a`, `vscode.module_b`, etc.
- Implements `find_spec`. Returns a `ModuleSpec` if it can handle the import. If so, this will also include an instance of `LocalModuleLoader`.
- Sends messages to clients running in user's local environment to request module source content.
  - If available, clients will send source content back to the path finder. The path finder will then construct a `ModuleSpec` with a loader capable of serving the source.
  - If not, will return `None` telling the import system to move on to next finder / loader

> Note: `find_spec` is a synchronous api, but message passing between the local client and server plugin is asynchronous. We'll need to handle this somehow. Possibly with `asyncio` or some other blocking mechanism.

**LocalModuleLoader class**

- Responsible for executing the module source content and updating `module.__dict__` with the resulting variables.

### VS Code Extension

- After establishing a session, send a Python snippet to instantiate the plugin and assign to `__deephaven_vscode `if it isn't already assigned. Fetch the `__deephaven_vscode` object, and add an event listener for messages.
- Still need to figure out what happens if multiple clients are subscribed. This "might" only be possible in Community
- We probably will need to provide a way to specify the root folder to use for local module sourcing. The "root" used by the plugin will need to have the same name as the folder in VS Code in order for pylance to resolve imports locally for intellisense. There's also some pylance VS Code settings that can be tweaked to allow the workspace folder name to be found. e.g. "python.analysis.extraPaths": [".."]. Would be nice if DH extension can hhandle this automatically if the workspace root is the intended folder. For simpler config, we could just always require a subfolder and a way to specify that as the root, but this could be annoying if users don't want that assuming we can reasonably configure automatically for them.

### Testing

- Single root workspaces
- Multi root workspaces
- **init**.py modules
- Include / exclude folders
- Error handling. Timeouts + other

### Questions

- Can another user get access to filesystem. Seems yes without some sort of user check
  yea
- Make sure VS Code will not serve modules that haven't been exposed / allowed
- Embed widget seems to not close connection when panel is closed
- Potential rename to "Remote module source" plugin
