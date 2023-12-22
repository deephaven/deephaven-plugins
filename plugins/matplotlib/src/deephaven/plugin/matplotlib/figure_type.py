from io import BytesIO
from weakref import WeakKeyDictionary, WeakSet
from matplotlib.figure import Figure
from deephaven.plugin.object_type import Exporter, FetchOnlyObjectType
from deephaven.execution_context import get_exec_ctx
from threading import Timer
from deephaven.liveness_scope import liveness_scope
from deephaven import input_table, new_table
from deephaven.column import string_col, int_col

# Name of the matplotlib figure object that was export
NAME = "matplotlib.figure.Figure"

# DPI for the figure
DPI = 144

# Dictionary to store the input tables created for each figure
_figure_tables = WeakKeyDictionary()

# Track the currently drawing figures, otherwise the stale_callback gets called when we call `savefig`
_exporting_figures = WeakSet()


def debounce(wait):
    """Postpone a functions execution until after some time has elapsed

    :type wait: int
    :param wait: The amount of Seconds to wait before the next call can execute.
    """

    def decorator(fun):
        def debounced(*args, **kwargs):
            def call_it():
                fun(*args, **kwargs)

            try:
                debounced.t.cancel()
            except AttributeError:
                pass

            debounced.t = Timer(wait, call_it)
            debounced.t.start()

        return debounced

    return decorator


# Creates an input table that will update a figures size when the input is set
# Has three different key value pairs:
# revision: Increases whenever the figure 'ticks'
# width: The width of panel displaying the figure
# height: The height of the panel displaying the figure
def _make_input_table(figure):
    input_t = None
    revision = 0

    # Need to track the execution context used so we can use it again when updating the revision
    exec_ctx = get_exec_ctx()

    t = new_table(
        [
            string_col("key", ["revision", "width", "height"]),
            int_col("value", [revision, 640, 480]),
        ]
    )

    input_t = input_table(init_table=t, key_cols=["key"])

    # TODO: Add listener to input table to update figure width/height

    @debounce(0.1)
    def update_revision():
        with exec_ctx:
            nonlocal revision
            revision = revision + 1
            input_t.add(
                new_table(
                    [string_col("key", ["revision"]), int_col("value", [revision])]
                )
            )

    def handle_figure_update(self, value):
        # Check if we're already drawing this figure, and the stale callback was triggered because of our call to savefig
        if self in _exporting_figures:
            return
        update_revision()

    figure.stale_callback = handle_figure_update

    return input_t


def _get_input_table(figure):
    if not figure in _figure_tables:
        _figure_tables[figure] = _make_input_table(figure)
    return _figure_tables[figure]


def _export_figure(figure):
    buf = BytesIO()

    try:
        # We need to keep track of the figure while drawing it, or the savefig call triggers our stale callback
        _exporting_figures.add(figure)
        figure.savefig(buf, format="PNG", dpi=DPI)
    finally:
        _exporting_figures.remove(figure)

    return buf.getvalue()


class FigureType(FetchOnlyObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object) -> bool:
        return isinstance(object, Figure)

    def to_bytes(self, exporter: Exporter, figure: Figure) -> bytes:
        with liveness_scope() as scope, get_exec_ctx():
            input_t = _get_input_table(figure)
            exporter.reference(input_t)
            scope.preserve(input_t)
        return _export_figure(figure)
