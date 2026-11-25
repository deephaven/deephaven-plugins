import threading
import time

from deephaven import time_table, ui
from deephaven.table_listener import TableUpdate

# Fixtures for verifying that a component is cleaned up when its connection
# closes while a render is still in progress.
# State is keyed by the `run` query param so parallel browser projects don't interfere.

# Every deephaven.ui render shares one server thread, so keep this short
_RENDER_CLEANUP_SLOW_RENDER_SECONDS = 3

_render_cleanup_ticks = time_table("PT0.1S").update("X = ii").tail(5)
_render_cleanup_status_ticks = time_table("PT0.25S")


class _RenderCleanupRun:
    def __init__(self) -> None:
        self.slow_render_started = False
        self.listener_calls = 0
        self.unmount_count = 0
        self.updates_after_unmount = 0


_render_cleanup_runs: dict[str, _RenderCleanupRun] = {}
_render_cleanup_lock = threading.Lock()


def _get_render_cleanup_run(run_id: str | None) -> _RenderCleanupRun:
    with _render_cleanup_lock:
        return _render_cleanup_runs.setdefault(run_id or "", _RenderCleanupRun())


@ui.component
def ui_render_cleanup_component():
    run = _get_render_cleanup_run(ui.use_query_param("run"))
    data = ui.use_table_data(_render_cleanup_ticks)
    render_queue = ui.use_render_queue()

    def apply_update():
        if run.unmount_count > 0:
            run.updates_after_unmount += 1

    def on_update(update: TableUpdate, is_replay: bool) -> None:
        run.listener_calls += 1
        render_queue(apply_update)

    ui.use_table_listener(_render_cleanup_ticks, on_update, [])

    def track_unmount():
        def cleanup():
            run.unmount_count += 1

        return cleanup

    ui.use_effect(track_unmount, [])

    # Start a slow render as soon as the first render has been sent
    is_slow, set_is_slow = ui.use_state(False)
    ui.use_effect(lambda: set_is_slow(True), [])
    if is_slow and not run.slow_render_started:
        run.slow_render_started = True
        time.sleep(_RENDER_CLEANUP_SLOW_RENDER_SECONDS)

    return ui.panel(
        ui.text("Slow render started" if is_slow else "Waiting for slow render"),
        ui.text(f"Rows: {len(data['X']) if data is not None else 0}"),
        title="Render Cleanup",
    )


@ui.component
def ui_render_cleanup_status_component():
    run = _get_render_cleanup_run(ui.use_query_param("run"))
    # Re-render periodically to show the latest values
    ui.use_table_data(_render_cleanup_status_ticks)

    return ui.panel(
        ui.text(f"Slow render started: {run.slow_render_started}"),
        ui.text(f"Unmount count: {run.unmount_count}"),
        ui.text(f"Listener calls: {run.listener_calls}"),
        ui.text(f"Updates after unmount: {run.updates_after_unmount}"),
        title="Render Cleanup Status",
    )


ui_render_cleanup = ui_render_cleanup_component()
ui_render_cleanup_status = ui_render_cleanup_status_component()
