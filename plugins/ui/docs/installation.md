# Installation

deephaven.ui is a plugin that works with [Deephaven](https://deephaven.io/core/docs/). Use the deephaven.ui plugin to build dynamic components and layouts using Deephaven.

## Enterprise

Enterprise installations come packaged with deephaven.ui and therefore don't require additional steps. The rest of the document pertains to Core installations.

## New installation

If you don't already have Deephaven installed, you can install via Docker or pip.

### Install and run with Docker

`deephaven.ui` can be run from pre-built Docker images. The image you use will depend on your version of Deephaven:

```bash
# For Deephaven < 0.37.0
docker run --name deephaven -p 10000:10000 ghcr.io/deephaven/server-ui:latest

# For Deephaven >= 0.37.0
docker run --name deephaven -p 10000:10000 ghcr.io/deephaven/server:latest
```

See the [Deephaven Docker install documentation](https://deephaven.io/core/docs/getting-started/docker-install/) for more information.

### Install and run with pip

deephaven.ui can easily be installed using the Python package manager pip. Simply run:

```sh
pip install deephaven-server deephaven-plugin-ui
```

Then you can run the Deephaven server with:

```sh
deephaven server
```

See the [Deephaven pip install documentation](https://deephaven.io/core/docs/getting-started/pip-install/) for more information.

## Existing installation

Installing Deephaven plugins is different whether you have Deephaven installed via Docker or via pip.

### Add to existing Docker install

With a running Docker container named `deephaven`, run the following from the command line:

```sh
docker exec deephaven pip install deephaven-plugin-ui
```

See the [documentation for installing packages in a running container](https://deephaven.io/core/docs/how-to-guides/install-and-use-python-packages/#install-packages-in-a-running-docker-container-from-the-command-line) for more details.

### Add to existing pip installation

With an existing `pip` installation of Deephaven server, just `pip install` the plugin:

```sh
pip install deephaven-plugin-ui
```

See the [documentation for using Python packages in Deephaven](https://deephaven.io/core/docs/how-to-guides/install-and-use-python-packages/#use-python-packages-in-deephaven) for more details.

# Verifying installation

After you have deephaven.ui installed, verify it is working correctly. Run Deephaven, and in the console enter the following command:

```python
from deephaven import ui

hello_world = ui.heading("Hello World!")
```

A panel will appear that displays the "Hello world!" text:
![Basic Hello World example.](./_assets/hello_world.png)
