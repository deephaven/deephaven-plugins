# Update Dictionaries in State

State can hold any kind of Python value, including dictionaries. But you should not change objects that you hold in the `deephaven.ui` state directly. Instead, when you want to update an dictionary, you need to create a new one (or make a copy of an existing one), and then set the state to use that copy.

## What is a mutation?
