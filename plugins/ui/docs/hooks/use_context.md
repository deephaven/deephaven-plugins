# use_context

Instead of passing props down through every level of the component tree, you can utilize the `use_context` hook to share values. `use_context` is a hook that consumes the current value of a `Context`, which tracks the value the most recent provider supplies for that context.

> [!TIP] > `use_context` and `Context` are based on React's Context API. See the [React docs](https://react.dev/learn/passing-data-deeply-with-context) for more in-depth explanations and examples.

## Example

```python
from deephaven import ui

# A context that holds the currency symbol for displaying prices
currency_ctx = ui.create_context("USD")


@ui.component
def price_label(amount: float):
    # Consume the current currency from the context
    currency = ui.use_context(currency_ctx)
    return ui.text(f"{currency} {amount:.2f}")


@ui.component
def euro_app():
    # Wrap the children in a provider that sets the currency to "EUR"
    return currency_ctx(
        "EUR",
        price_label(9.99),  # displays "EUR 9.99"
        price_label(24.50),  # displays "EUR 24.50"
    )


euro_context_app = euro_app()
```

> [!NOTE]
> These examples are simplified for clarity. Generally, context is best suited for components with significantly more nested layers.

## Nesting providers

Providers can be nested. The nearest provider in the tree supplies the value as inner providers override outer ones.

```python
from deephaven import ui

currency_ctx = ui.create_context("USD")


@ui.component
def price_label(label: str, amount: float):
    currency = ui.use_context(currency_ctx)
    return ui.text(f"{label}: {currency} {amount:.2f}")


@ui.component
def euro_section():
    # Overrides the "GBP" value from the parent with "EUR"
    return currency_ctx(
        "EUR",
        price_label("Coffee", 3.50),  # displays "EUR 3.50"
    )


@ui.component
def override_app():
    return currency_ctx(
        "GBP",
        price_label("Tea", 2.00),  # displays "GBP 2.00"
        euro_section(),  # displays "EUR 3.50"
        price_label("Biscuit", 1.25),  # displays "GBP 1.25"
    )


currency_override_app = override_app()
```

## Multiple contexts

Multiple independent contexts can be provided simultaneously on the same component tree.

```python
from deephaven import ui

currency_ctx = ui.create_context("USD")
decimal_places_ctx = ui.create_context(2)


@ui.component
def price_label(amount: float):
    currency = ui.use_context(currency_ctx)
    decimals = ui.use_context(decimal_places_ctx)
    return ui.text(f"{currency} {amount:.{decimals}f}")


@ui.component
def multiple_app():
    return currency_ctx(
        "JPY",
        decimal_places_ctx(
            0,
            price_label(1001.5),  # currency="JPY", decimals=0, displays "JPY 1002"
        ),
    )


currency_multiple_app = multiple_app()
```

## Default value

If `use_context` is called outside any provider, it returns the default value passed to `Context()`.

```python
from deephaven import ui

currency_ctx = ui.create_context("USD")


@ui.component
def price_label(amount: float):
    # No provider, so currency is always "USD"
    currency = ui.use_context(currency_ctx)
    return ui.text(f"{currency} {amount:.2f}")


default_price = price_label(9.99)  # displays "USD 9.99"
```

## Recommendations

1. **Prefer context to avoid prop drilling**: If you are passing the same prop through many levels of components that don't use it, consider using context.
2. **One context per concern**: Keep each `Context` object focused on a single value. Bundling many unrelated values into one context means all consumers re-render whenever any part changes.
3. **Provide close to the root**: Wrap the smallest subtree that actually needs the value. This keeps the scope of the provided value explicit.
