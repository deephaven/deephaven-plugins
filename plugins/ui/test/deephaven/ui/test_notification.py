from __future__ import annotations

from unittest.mock import Mock

from .BaseTest import BaseTestCase
from deephaven.ui._internal.EventContext import EventContext


class NotificationTestCase(BaseTestCase):
    """Tests for the ui.notification API."""

    def test_sends_notification_event(self):
        from deephaven.ui.components.notification import notification

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            notification("Hello")

        send_event_mock.assert_called_once()
        name, payload = send_event_mock.call_args[0]
        self.assertEqual(name, "notification.event")
        self.assertEqual(payload["title"], "Hello")
        # None-valued options should be removed
        self.assertNotIn("description", payload)
        self.assertNotIn("icon", payload)
        self.assertNotIn("onClick", payload)

    def test_converts_options_to_camel_case(self):
        from deephaven.ui.components.notification import notification

        on_click = lambda: None
        on_close = lambda: None
        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            notification(
                "Title",
                description="Body text",
                icon="https://example.com/icon.png",
                tag="my-tag",
                silent=True,
                on_click=on_click,
                on_close=on_close,
            )

        send_event_mock.assert_called_once()
        name, payload = send_event_mock.call_args[0]
        self.assertEqual(name, "notification.event")
        self.assertEqual(payload["title"], "Title")
        self.assertEqual(payload["description"], "Body text")
        self.assertEqual(payload["icon"], "https://example.com/icon.png")
        self.assertEqual(payload["tag"], "my-tag")
        self.assertEqual(payload["silent"], True)
        self.assertIs(payload["onClick"], on_click)
        self.assertIs(payload["onClose"], on_close)

    def test_raises_outside_render_thread(self):
        from deephaven.ui.components.notification import (
            notification,
            NotificationException,
        )

        with self.assertRaises(NotificationException):
            notification("Hello")
