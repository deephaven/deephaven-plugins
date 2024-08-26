import threading
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseExecutionContextTestCase(BaseTestCase):
    def test_execution_context(self):
        from deephaven.ui.hooks import use_execution_context, use_state, use_memo
        from deephaven import empty_table

        def _test_execution_context():
            with_exec_ctx = use_execution_context()

            def table_func():
                # This would fail if not using an execution context
                empty_table(0).update("X=1")

            def thread_func():
                with_exec_ctx(table_func)

            def start_thread():
                thread = threading.Thread(target=thread_func)
                thread.start()
                thread.join()

            use_memo(start_thread, [])

        render_hook(_test_execution_context)

    def test_execution_context_custom(self):
        from deephaven.ui.hooks import use_execution_context, use_memo
        from deephaven import empty_table
        from deephaven.execution_context import make_user_exec_ctx

        def _test_execution_context():
            with_exec_ctx = use_execution_context(make_user_exec_ctx())

            def table_func():
                # This would fail if not using an execution context
                empty_table(0).update("X=1")

            def thread_func():
                with_exec_ctx(table_func)

            def start_thread():
                thread = threading.Thread(target=thread_func)
                thread.start()

            use_memo(start_thread, [])

        render_hook(_test_execution_context)
