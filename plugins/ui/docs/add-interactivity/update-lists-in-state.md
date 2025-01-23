# Update Lists in State

Python lists are mutable, but you should treat them as immutable when you store them in state. Just like with dictionaries, when you want to update an list stored in state, you need to create a new one (or make a copy of an existing one), and then set state to use the new list.

## Update lists without mutation

Like with dictionaries, you should treat lists in `deephaven.ui` state as read-only. This means that you should not reassign items inside an list like `my_list[0] = "bird"`, and you also should not use methods that mutate the list, such as `append()` and `remove()`.

Instead, every time you want to update an list, you will want to pass a new list to your state setting function. To do that, you can create a new list from the original list in your state by copying the list or creating new list via list comprehension. Then you can set your state to the resulting new list.

## Add to a list
