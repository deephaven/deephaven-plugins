# Importing and Exporting Components

The value of `deephaven.ui` components lies in their reusability: you can create components that are composed of other components. But as you nest more and more components, it often makes sense to start splitting them into different files. This lets you keep your files easy to scan and reuse components in more places.

## Exporting and Importing in Deephaven Core

In Deephaven Core, Python scripts cannot import from other Python scripts by default. In order to import from another script, you must place the script in the `data directory` and tell the Python interpreter where the `data directory` is located. For details on how to do this, see [How do I import one Python script into another in the Deephaven IDE?](/core/docs/reference/community-questions/import-python-script)

### Example Export in Deephaven Core

```python
# file1.py
from deephaven import ui


@ui.component
def table_of_contents():
    return ui.flex(
        ui.heading("My First Component"),
        ui.text("- Components: UI Building Blocks"),
        ui.text("- Defining a Component"),
        ui.text("- Using a Component"),
        direction="column",
    )
```

### Example Import in Deephaven Core

```python
# file2.py
# Tell the Python interpreter where the data directory is located
import sys

sys.path.append("/data/storage/notebooks")

from deephaven import ui

# Import component from file1
from file1 import table_of_contents


@ui.component
def multiple_contents():
    return ui.flex(
        table_of_contents(),
        table_of_contents(),
        table_of_contents(),
    )


my_multiple_contents = multiple_contents()
```

## Exporting and Importing in Deephaven Enterprise

In Deephaven Enterprise, notebook files are stored in a secure file system which prevents importing by default. In order to import from another script, you can use the `deephaven_enterprise.notebook` module to do either an `exec_notebook` or a `meta_import`. For details on how to do this, see [Modularizing Queries](/enterprise/docs/development/modularizing-queries).

### Example Export in Deephaven Enterprise

```python
# file1.py
from deephaven import ui


@ui.component
def table_of_contents():
    return ui.flex(
        ui.heading("My First Component"),
        ui.text("- Components: UI Building Blocks"),
        ui.text("- Defining a Component"),
        ui.text("- Using a Component"),
        direction="column",
    )
```

### Example Import in Deephaven Enterprise

```python
# file2.py
# Use the notebook module to meta_import file1.py
from deephaven_enterprise.notebook import meta_import

meta_import(db, "nb")

# Import component from file1
from nb.file1 import table_of_contents

from deephaven import ui


@ui.component
def multiple_contents():
    return ui.flex(
        table_of_contents(),
        table_of_contents(),
        table_of_contents(),
    )


my_multiple_contents = multiple_contents()
```
