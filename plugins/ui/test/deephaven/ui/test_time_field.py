import unittest

from .BaseTest import BaseTestCase


class TimeFieldTest(BaseTestCase):
    def test_convert_time_props(self):
        from deephaven.time import to_j_instant, to_j_zdt, to_j_local_time
        from deephaven.ui.components.time_field import _convert_time_field_props
        from deephaven.ui._internal.utils import (
            get_jclass_name,
            _convert_to_java_time,
        )

        def verify_is_local_time(timeStr):
            self.assertEqual(
                get_jclass_name(_convert_to_java_time(timeStr)), "java.time.LocalTime"
            )

        def verify_is_instant(timeStr):
            self.assertEqual(
                get_jclass_name(_convert_to_java_time(timeStr)), "java.time.Instant"
            )

        def verify_is_zdt(timeStr):
            self.assertEqual(
                get_jclass_name(_convert_to_java_time(timeStr)),
                "java.time.ZonedDateTime",
            )

        def empty_on_change():
            pass

        props1 = {
            "placeholder_value": "10:30:45",
            "value": "10:30:45",
            "default_value": "10:30:45",
            "min_value": to_j_zdt("2021-01-01T10:30:45 ET"),
            "max_value": to_j_local_time("10:30:45"),
        }

        props2 = {
            "value": to_j_local_time("10:30:45"),
            "default_value": to_j_zdt("2021-01-01T10:30:45 ET"),
            "placeholder_value": to_j_instant("2021-01-01T10:30:45 UTC"),
            "on_change": verify_is_local_time,
        }

        props3 = {
            "default_value": to_j_instant("2021-01-01T10:30:45 UTC"),
            "placeholder_value": to_j_zdt("2021-01-01T10:30:45 ET"),
            "on_change": verify_is_instant,
        }

        props4 = {
            "placeholder_value": to_j_zdt("2021-01-01T10:30:45 ET"),
            "on_change": verify_is_zdt,
        }

        props5 = {"on_change": verify_is_local_time}

        props6 = {"on_change": empty_on_change}

        _convert_time_field_props(props3)
        _convert_time_field_props(props4)
        _convert_time_field_props(props5)
        _convert_time_field_props(props6)

        verify_is_local_time(props1["max_value"])
        verify_is_zdt(props1["min_value"])
        verify_is_local_time(props1["value"])
        verify_is_local_time(props1["default_value"])
        verify_is_local_time(props1["placeholder_value"])

        props2["on_change"]("10:30:45")
        props3["on_change"]("2021-01-01T10:30:45 UTC")
        props4["on_change"]("2021-01-01T10:30:45 ET")
        props5["on_change"]("10:30:45")

        # pass an Local Time but it should be dropped with no error
        props6["on_change"]("10:30:45")


if __name__ == "__main__":
    unittest.main()
