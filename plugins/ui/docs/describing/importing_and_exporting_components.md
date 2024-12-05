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
# Tell the Python interpreter where the data directory is located
import sys

sys.path.append("/data/storage/notebooks")

# file2.py
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

# Exporting in Python

By default, values and functions defined in a Python file are automatically exported. Define a component in a file `file1.py`:

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

# Importing in Python

Use the `import` and `from` keywords to import values from a separate Python file. In `file2.py`:

```python
# file2.py
from deephaven import ui
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

# Deephaven Core Data Directory

To import Python scripts in Deephaven Core, you must tell the Python interpreter the location of the data directory where the files are stored. For details on how to do this, see [How do I import one Python script into another in the Deephaven IDE?](/core/docs/reference/community-questions/import-python-script)

# Deephaven Enterprise `notebook` module

To import Python scripts in Deephaven Enterprise, you can use the `notebook` module. See [Modularizing Queries](/enterprise/docs/development/modularizing-queries).
