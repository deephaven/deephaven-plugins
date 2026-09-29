"""
Factories for ``tests/ui_orphan_panels.spec.ts``.

Each test creates its own widget in the console, passing a per-test ``cfg``
dict. Mutating ``cfg`` from the console does not re-render the open widget, so
the first render after a page reload produces a different document than the
one the saved layout was created from.

Supported ``cfg`` keys:

- ``count``: number of numbered panels to render.
- ``layout``: ``"stack"`` (default) puts all panels in one stack; ``"split"``
  puts the last panel alone in a second stack.
- ``show_table``: when present, renders a ``Table Panel`` showing a table if
  true, or plain text if false.
- ``fail``: raise during render.
- ``label``: prefix for panel titles and content (default ``"Orphan"``).
"""

from deephaven import ui, empty_table

_orphan_table = empty_table(20).update(["a = i", "b = i * 2"])


def _tabs_panel(label, index):
    return ui.panel(
        ui.tabs(
            ui.tab(ui.text(f"{label} panel {index} first tab"), title="Tab One"),
            ui.tab(ui.text(f"{label} panel {index} second tab"), title="Tab Two"),
            ui.tab(ui.text(f"{label} panel {index} third tab"), title="Tab Three"),
        ),
        title=f"{label} Panel {index}",
    )


@ui.component
def _orphan_panels(cfg):
    clicks, set_clicks = ui.use_state(0)
    extra, set_extra = ui.use_state(False)

    if cfg.get("fail", False):
        raise ValueError("Orphan fixture failure")

    label = cfg.get("label", "Orphan")
    controls = ui.panel(
        ui.button(f"Clicked {clicks} times", on_press=lambda: set_clicks(clicks + 1)),
        ui.button("Add panel", on_press=lambda: set_extra(True)),
        title=f"{label} Controls",
    )
    count = cfg["count"] + (1 if extra else 0)
    panels = [_tabs_panel(label, i) for i in range(1, count + 1)]
    if "show_table" in cfg:
        panels.append(
            ui.panel(
                ui.table(_orphan_table)
                if cfg["show_table"]
                else ui.text("Table hidden"),
                title="Table Panel",
            )
        )

    if cfg.get("layout") == "split" and len(panels) > 1:
        return ui.row(ui.stack(controls, *panels[:-1]), ui.stack(panels[-1]))
    return ui.stack(controls, *panels)


def orphan_nested(cfg):
    """Panels in a dashboard nested inside a single panel."""
    return ui.panel(ui.dashboard(_orphan_panels(cfg)), title="Orphan Host")


def orphan_deep(cfg):
    """An outer nested dashboard containing an inner one with the same widget."""
    return ui.panel(
        ui.dashboard(
            ui.row(
                ui.panel(ui.text("Outer keep content"), title="Outer Keep"),
                ui.panel(ui.dashboard(_orphan_panels(cfg)), title="Inner Host"),
            )
        ),
        title="Orphan Deep Host",
    )
