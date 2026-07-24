from __future__ import annotations

from unittest.mock import Mock

from .BaseTest import BaseTestCase
from deephaven.ui._internal.EventContext import EventContext


class ToneTestCase(BaseTestCase):
    """Tests for the ui.tone API."""

    def test_sends_tone_event(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone("C4")

        send_event_mock.assert_called_once()
        name, payload = send_event_mock.call_args[0]
        self.assertEqual(name, "tone.event")
        self.assertEqual(payload["notes"], [{"notes": ["C4"], "duration": 0.2}])
        self.assertEqual(payload["gap"], 0.05)
        self.assertEqual(payload["waveform"], "sine")
        self.assertEqual(payload["gain"], 0.5)

    def test_accepts_frequency(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone(440)

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["notes"], [{"notes": [440], "duration": 0.2}])

    def test_normalizes_sequence(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone(["C4", "E4", "G4"], duration=0.3)

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(
            payload["notes"],
            [
                {"notes": ["C4"], "duration": 0.3},
                {"notes": ["E4"], "duration": 0.3},
                {"notes": ["G4"], "duration": 0.3},
            ],
        )

    def test_normalizes_chord(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone([["C4", "E4", "G4"]])

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(
            payload["notes"], [{"notes": ["C4", "E4", "G4"], "duration": 0.2}]
        )

    def test_normalizes_per_note_duration(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone(["C4", ("E4", 0.5), (["G4", "B4"], 0.75)])

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(
            payload["notes"],
            [
                {"notes": ["C4"], "duration": 0.2},
                {"notes": ["E4"], "duration": 0.5},
                {"notes": ["G4", "B4"], "duration": 0.75},
            ],
        )

    def test_passes_options(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone("C4", gap=0.1, waveform="square", gain=0.25)

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["gap"], 0.1)
        self.assertEqual(payload["waveform"], "square")
        self.assertEqual(payload["gain"], 0.25)

    def test_normalizes_rest(self):
        from deephaven.ui.components.tone import tone

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            tone(["C4", None, ("E4", 0.5), (None, 0.75)])

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(
            payload["notes"],
            [
                {"notes": ["C4"], "duration": 0.2},
                {"notes": [], "duration": 0.2},
                {"notes": ["E4"], "duration": 0.5},
                {"notes": [], "duration": 0.75},
            ],
        )

    def test_rejects_invalid_waveform(self):
        from deephaven.ui.components.tone import tone, ToneException

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            with self.assertRaises(ToneException):
                tone("C4", waveform="triangle-wave")

    def test_rejects_invalid_gain(self):
        from deephaven.ui.components.tone import tone, ToneException

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            with self.assertRaises(ToneException):
                tone("C4", gain=2)

    def test_rejects_invalid_note_name(self):
        from deephaven.ui.components.tone import tone, ToneException

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            with self.assertRaises(ToneException):
                tone("H4")

    def test_rejects_non_positive_frequency(self):
        from deephaven.ui.components.tone import tone, ToneException

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            with self.assertRaises(ToneException):
                tone(0)

    def test_rejects_empty_chord(self):
        from deephaven.ui.components.tone import tone, ToneException

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        with ec.open():
            with self.assertRaises(ToneException):
                tone([[]])

    def test_raises_outside_render_thread(self):
        from deephaven.ui.components.tone import tone, ToneException

        with self.assertRaises(ToneException):
            tone("C4")
