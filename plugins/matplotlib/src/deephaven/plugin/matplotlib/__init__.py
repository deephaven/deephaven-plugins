from deephaven import numpy as dhnp
from deephaven.plugin import Registration, Callback
from deephaven.table_listener import listen
from importlib import resources
import matplotlib.pyplot as plt
from matplotlib.animation import Animation
import itertools

__version__ = "0.3.0.dev0"


def _init_theme():
    # Set the Deephaven style globally.
    # We use the savefig function to export the Figure, and that uses the Figure's properties for colours rather than temporary styling.
    # The Figure's properties are set on creation time of the Figure, rather than when the Figure is exported
    # We do not have hooks into when a user creates a new Figure, so we set the theme globally ahead of time
    # https://github.com/matplotlib/matplotlib/issues/6592/
    with resources.path(__package__, "deephaven.mplstyle") as p:
        plt.style.use(["dark_background", p])


class MatplotlibRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        _init_theme()
        plt.switch_backend("AGG")
        from . import figure_type

        callback.register(figure_type.FigureType)


class TableEventSource:
    """
    Makes an event source for matplotlib that triggers whenever Deephaven Table updates.

    Parameters
    ----------
    table : `~deephaven.Table`
        The table object used to listen for updates

    callbacks : list[tuple[callable, tuple, dict]], optional
        List of (func, args, kwargs) tuples that will be called upon
        timer events.  This list is accessible as ``timer.callbacks`` and
        can be manipulated directly, or the functions `add_callback` and
        `remove_callback` can be used.
    """

    def __init__(self, table, callbacks=None):
        self._table = table
        self._listener = None
        self.callbacks = [] if callbacks is None else callbacks.copy()

    def add_callback(self, func, *args, **kwargs):
        """
        Register *func* to be called by timer when the event fires. Any
        additional arguments provided will be passed to *func*.

        This function returns *func*, which makes it possible to use it as a
        decorator.
        """
        self.callbacks.append((func, args, kwargs))
        return func

    def remove_callback(self, func, *args, **kwargs):
        """
        Remove *func* from list of callbacks.
        """
        funcs = [c[0] for c in self.callbacks]
        if func in funcs:
            self.callbacks.pop(funcs.index(func))

    def _on_table_update(self, update, is_replay):
        """
        Runs all function that have been registered as callbacks. Functions
        can return False (or 0) if they should not be called any more. If there
        are no callbacks, the timer is automatically stopped.
        """
        for func, args, kwargs in self.callbacks:
            ret = func(update, *args, **kwargs)
            if ret == 0:
                self.remove_callback(func)

        if len(self.callbacks) == 0:
            self.stop()

    def start(self):
        if self._listener is None:
            self._listener = listen(self._table, self._on_table_update)

    def stop(self):
        if self._listener is not None:
            self._listener.stop()
            self._listener = None


class TableAnimation(Animation):
    """
    Makes an animation by calling a function *func* whenever the Deephaven Table *table* is updated.

    .. note::

        You must store the created Animation in a variable that lives as long
        as the animation should run. Otherwise, the Animation object will be
        garbage-collected and the animation stops.

    fig : `~matplotlib.figure.Figure`
        The figure object used to get needed events, such as draw or resize.

    table : `~deephaven.Table`
        The table object used to listen for updates

    func : callable
        The function to call at each update. The first argument is a dictionary
        with the new data arrays, the second argument is the update that
        triggered the function. On the first call `update` will be `None`.
        Any additional positional arguments can be supplied via the *fargs*
        parameter.

        The required signature is::

            def func(data, update, *fargs) -> None

    columns : tuple or None, optional
        Names of columns to send along in the update, or None to send all column data

    fargs : tuple or None, optional
        Additional arguments to pass to each call to *func*.

    """

    def __init__(self, fig, table, func, columns=None, fargs=None, **kwargs):
        if fargs:
            self._args = fargs
        else:
            self._args = ()
        self._func = func
        self._table = table
        if columns is None:
            self._columns = [column.name for column in table.columns]
        else:
            self._columns = columns
        self._last_update = None
        event_source = TableEventSource(table)
        super().__init__(fig, event_source, **kwargs)

        # Start the animation right away
        self._start()

    def new_frame_seq(self):
        """
        new_frame_seq
        """
        # Use the generating function to generate a new frame sequence
        return itertools.count()

    def _step(self, update, *args):
        """Handler for getting events."""
        # Extends the _step() method for the Animation class. Used
        # to get the update information
        self._last_update = update
        return super()._step(*args)

    def _draw_frame(self, framedata):
        data = {}
        for column in self._columns:
            data[column] = dhnp.to_numpy(self._table, [column])[:, 0]
        self._func(data, self._last_update, *self._args)
