import unittest

from .BaseTest import BaseTestCase


class DateRangePickerTest(BaseTestCase):
    def test_convert_date_range_picker_props(self):
        from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date
        from deephaven.ui.components.date_range_picker import (
            _convert_date_range_picker_props,
        )
        from deephaven.ui._internal.utils import (
            get_jclass_name,
            convert_list_prop,
            _convert_to_java_date,
        )

        def verify_is_local_date(dateStr):
            self.assertEqual(
                get_jclass_name(_convert_to_java_date(dateStr)), "java.time.LocalDate"
            )

        def verify_is_instant(dateStr):
            self.assertEqual(
                get_jclass_name(_convert_to_java_date(dateStr)), "java.time.Instant"
            )

        def verify_is_zdt(dateStr):
            self.assertEqual(
                get_jclass_name(_convert_to_java_date(dateStr)),
                "java.time.ZonedDateTime",
            )

        def empty_on_change():
            pass

        props1 = {
            "placeholder_value": "2021-01-01",
            "value": {"start": "2021-01-01 UTC", "end": "2021-01-02 UTC"},
            "default_value": {"start": "2021-01-01 ET", "end": "2021-01-02 ET"},
            "min_value": to_j_zdt("2021-01-01 ET"),
            "max_value": to_j_local_date("2021-01-01"),
        }

        props2 = {
            "value": {
                "start": to_j_local_date("2021-01-01"),
                "end": to_j_local_date("2021-01-02"),
            },
            "default_value": {
                "start": to_j_zdt("2021-01-01 ET"),
                "end": to_j_zdt("2021-01-02 ET"),
            },
            "placeholder_value": to_j_instant("2021-01-01 UTC"),
            "on_change": verify_is_local_date,
        }

        props3 = {
            "default_value": {
                "start": to_j_instant("2021-01-01 UTC"),
                "end": to_j_instant("2021-01-02 UTC"),
            },
            "placeholder_value": to_j_zdt("2021-01-01 ET"),
            "on_change": verify_is_instant,
        }

        props4 = {
            "placeholder_value": to_j_zdt("2021-01-01 ET"),
            "on_change": verify_is_zdt,
        }

        props5 = {"on_change": verify_is_instant}

        props6 = {"on_change": empty_on_change}

        _convert_date_range_picker_props(props1)
        _convert_date_range_picker_props(props2)
        _convert_date_range_picker_props(props3)
        _convert_date_range_picker_props(props4)
        _convert_date_range_picker_props(props5)
        _convert_date_range_picker_props(props6)

        verify_is_local_date(props1["max_value"])
        verify_is_zdt(props1["min_value"])
        verify_is_zdt(props1["value"]["start"])
        verify_is_zdt(props1["value"]["end"])
        verify_is_zdt(props1["default_value"]["start"])
        verify_is_zdt(props1["default_value"]["end"])
        verify_is_local_date(props1["placeholder_value"])

        props2["on_change"]({"start": "2021-01-01", "end": "2021-01-02"})
        props3["on_change"]({"start": "2021-01-01 UTC", "end": "2021-01-02 UTC"})
        props4["on_change"]({"start": "2021-01-01 ET", "end": "2021-01-02 ET"})
        props5["on_change"]({"start": "2021-01-01 UTC", "end": "2021-01-02 UTC"})

        # pass an Instant but it should be dropped with no error
        props6["on_change"]({"start": "2021-01-01 UTC", "end": "2021-01-02 UTC"})


if __name__ == "__main__":
    unittest.main()
