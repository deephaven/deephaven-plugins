import unittest

from .BaseTest import BaseTestCase


class DatePickerTest(BaseTestCase):
    def test_convert_date_props(self):
        from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date
        from deephaven.ui.components.date_picker import _convert_date_picker_props
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
            "value": "2021-01-01 UTC",
            "default_value": "2021-01-01 ET",
            "unavailable_dates": [to_j_instant("2021-01-01 UTC"), "2021-01-01"],
            "min_value": to_j_zdt("2021-01-01 ET"),
            "max_value": to_j_local_date("2021-01-01"),
        }

        props2 = {
            "value": to_j_local_date("2021-01-01"),
            "default_value": to_j_zdt("2021-01-01 ET"),
            "placeholder_value": to_j_instant("2021-01-01 UTC"),
            "on_change": verify_is_local_date,
            "unavailable_dates": None,
        }

        props3 = {
            "default_value": to_j_instant("2021-01-01 UTC"),
            "placeholder_value": to_j_zdt("2021-01-01 ET"),
            "on_change": verify_is_instant,
        }

        props4 = {
            "placeholder_value": to_j_zdt("2021-01-01 ET"),
            "on_change": verify_is_zdt,
        }

        props5 = {"on_change": verify_is_instant}

        props6 = {"on_change": empty_on_change}

        _convert_date_picker_props(props1)
        props1["unavailable_dates"] = convert_list_prop(
            "unavailable_dates", props1["unavailable_dates"]
        )
        _convert_date_picker_props(props2)
        props2["unavailable_dates"] = convert_list_prop(
            "unavailable_dates", props2["unavailable_dates"]
        )
        _convert_date_picker_props(props3)
        _convert_date_picker_props(props4)
        _convert_date_picker_props(props5)
        _convert_date_picker_props(props6)

        verify_is_local_date(props1["max_value"])
        verify_is_zdt(props1["min_value"])
        verify_is_instant(props1["unavailable_dates"][0])
        verify_is_local_date(props1["unavailable_dates"][1])
        verify_is_instant(props1["value"])
        verify_is_zdt(props1["default_value"])
        verify_is_local_date(props1["placeholder_value"])

        props2["on_change"]("2021-01-01")
        self.assertIsNone(props2["unavailable_dates"])
        props3["on_change"]("2021-01-01 UTC")
        props4["on_change"]("2021-01-01 ET")
        props5["on_change"]("2021-01-01 UTC")

        # pass an Instant but it should be dropped with no error
        props6["on_change"]("2021-01-01 UTC")


if __name__ == "__main__":
    unittest.main()
