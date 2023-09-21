import logging

logger = logging.getLogger(__name__)


class RenderContext:
    """
    Context for rendering a component. Keeps track of state and child contexts.
    Used by hooks to get and set state.
    """

    def __init__(self):
        self._hook_index = -1
        self._state = {}
        self._children_context = {}
        self._on_change = lambda: None

        # Will be initialized on render
        self._hook_count = None

    def _notify_change(self):
        """
        Notify the parent context that this context has changed.
        Note that we're just re-rendering the whole tree on change.
        TODO: We should be able to do better than this, and only re-render the parts that have actually changed.
        """
        logger.debug("Notifying parent context that child context has changed")
        self._on_change()

    def set_on_change(self, on_change):
        """
        Set the on_change callback.
        """
        self._on_change = on_change

    def has_state(self, key):
        """
        Check if the given key is in the state.
        """
        return key in self._state

    def get_state(self, key, default=None):
        """
        Get the state for the given key.
        """
        if key not in self._state:
            self._state[key] = default
        return self._state[key]

    def set_state(self, key, value):
        """
        Set the state for the given key.
        """
        # TODO: Should we throw here if it's called when we're in the middle of a render?
        should_notify = False
        if key in self._state:
            # We only want to notify of a change when the value actually changes, not on the initial render
            should_notify = True
        self._state[key] = value
        if should_notify:
            self._notify_change()

    def get_child_context(self, key) -> "RenderContext":
        """
        Get the child context for the given key.
        """
        logger.debug("Getting child context for key %s", key)
        if key not in self._children_context:
            logger.debug("Creating new child context for key %s", key)
            child_context = RenderContext()
            child_context.set_on_change(self._notify_change)
            self._children_context[key] = child_context
        return self._children_context[key]

    def start_render(self):
        """
        Start rendering this component.
        """
        self._hook_index = -1

    def finish_render(self):
        """
        Finish rendering this component.
        """
        if self._hook_count is None:
            self._hook_count = self._hook_index + 1
        if self._hook_count != self._hook_index + 1:
            raise Exception(
                "Expected to use {} hooks, but used {}".format(
                    self._hook_count, self._hook_index + 1
                )
            )
        pass

    def next_hook_index(self):
        """
        Increment the hook index.
        """
        self._hook_index += 1
        return self._hook_index
