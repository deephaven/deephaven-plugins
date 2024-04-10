import unittest

from .BaseTest import BaseTestCase


class DatePickerTest(BaseTestCase):
    def test_convert_date_props(self):
        from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date
        from deephaven.ui.components.date_picker import _convert_date_picker_props
        from deephaven.ui._internal.utils import get_jclass_name

        def verify_is_local_date(date):
            self.assertEqual(get_jclass_name(date), "java.time.LocalDate")

        def verify_is_instant(date):
            self.assertEqual(get_jclass_name(date), "java.time.Instant")

        def verify_is_zdt(date):
            self.assertEqual(get_jclass_name(date), "java.time.ZonedDateTime")

        def empty_on_change():
            pass

        props1 = {
            "placeholder_value": "2021-01-01",
            "value": "2021-01-01 UTC",
            "default_value": "2021-01-01 ET",
            "unavailable_dates": [to_j_instant("2021-01-01 UTC")],
            "min_value": to_j_zdt("2021-01-01 ET"),
            "max_value": to_j_local_date("2021-01-01"),
        }

        props2 = {
            "value": to_j_local_date("2021-01-01"),
            "default_value": to_j_zdt("2021-01-01 ET"),
            "placeholder_value": to_j_instant("2021-01-01 UTC"),
            "on_change": verify_is_local_date,
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
        _convert_date_picker_props(props2)
        _convert_date_picker_props(props3)
        _convert_date_picker_props(props4)
        _convert_date_picker_props(props5)
        _convert_date_picker_props(props6)

        verify_is_local_date(props1["max_value"])
        verify_is_zdt(props1["min_value"])
        verify_is_instant(props1["unavailable_dates"][0])
        verify_is_instant(props1["value"])
        verify_is_instant(props1["default_value"])
        verify_is_local_date(props1["placeholder_value"])

        props2["on_change"]("2021-01-01")
        props3["on_change"]("2021-01-01 UTC")
        props4["on_change"]("2021-01-01 ET")
        props5["on_change"]("2021-01-01 UTC")

        # pass an Instant but it should be dropped with no error
        props6["on_change"]("2021-01-01 UTC")


if __name__ == "__main__":
    unittest.main()
