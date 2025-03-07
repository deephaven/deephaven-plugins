import unittest

from .BaseTest import BaseTestCase


class LabeledValueTest(BaseTestCase):
    def test_convert_labeled_value_props(self):
        from deephaven.ui.components.labeled_value import _convert_labeled_value_props
        from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date

        def verify_non_dates_not_converted(props):
            newProps = _convert_labeled_value_props(props)
            self.assertEqual(newProps, props)
            self.assertEqual(newProps["is_date"], False)

        def verify_date_converted_to_string(props, expected_value, timezone=None):
            newProps = _convert_labeled_value_props(props)
            self.assertEqual(newProps["value"], expected_value)
            self.assertEqual(newProps["timezone"], timezone)
            self.assertEqual(newProps["is_date"], True)
            self.assertEqual(newProps["is_nanoseconds"], False)

        def verify_date_converted_to_nanos(props, expected_value, timezone=None):
            newProps = _convert_labeled_value_props(props)
            self.assertEqual(newProps["value"], expected_value)
            self.assertEqual(newProps["timezone"], timezone)
            self.assertEqual(newProps["is_date"], True)
            self.assertEqual(newProps["is_nanoseconds"], True)

        def verify_date_range_conversion(props, expected_value, timezone=None):
            newProps = _convert_labeled_value_props(props)
            self.assertEqual(newProps["value"], expected_value)
            self.assertEqual(newProps["timezone"], timezone)
            self.assertEqual(newProps["is_date"], True)

        # number without date format
        verify_non_dates_not_converted({"value": 0, "timezone": None})
        # string without date format
        verify_non_dates_not_converted({"value": "0", "timezone": None})
        # number range without date format
        verify_non_dates_not_converted(
            {"value": {"start": 0, "end": 1}, "timezone": None}
        )
        # string range without date format
        verify_non_dates_not_converted(
            {"value": {"start": "0", "end": "1"}, "timezone": None}
        )
        # string list without date format
        verify_non_dates_not_converted({"value": ["0", "1"], "timezone": None})

        # number with date format
        verify_date_converted_to_nanos(
            {
                "value": 2053859400123450000,
                "format_options": {"date_format": ""},
                "timezone": None,
            },
            "2053859400123450000",
        )
        # string with date format
        verify_date_converted_to_nanos(
            {
                "value": "2053859400123450000",
                "format_options": {"date_format": ""},
                "timezone": None,
            },
            "2053859400123450000",
        )
        # instant
        verify_date_converted_to_nanos(
            {"value": to_j_instant("2035-01-31T12:30:00.12345Z"), "timezone": None},
            "2053859400123450000",
        )
        # local date
        verify_date_converted_to_string(
            {"value": to_j_local_date("2035-01-31"), "timezone": None}, "2035-01-31"
        )
        # number range with date format
        verify_date_range_conversion(
            {
                "value": {"start": 2053859400123450000, "end": 2053859400123450001},
                "format_options": {"date_format": ""},
                "timezone": None,
            },
            {
                "start": "2053859400123450000",
                "end": "2053859400123450001",
                "isStartNanoseconds": True,
                "isEndNanoseconds": True,
            },
        )
        # string range with date format
        verify_date_range_conversion(
            {
                "value": {"start": "2053859400123450000", "end": "2053859400123450001"},
                "format_options": {"date_format": ""},
                "timezone": None,
            },
            {
                "start": "2053859400123450000",
                "end": "2053859400123450001",
                "isStartNanoseconds": True,
                "isEndNanoseconds": True,
            },
        )
        # instant range
        verify_date_range_conversion(
            {
                "value": {
                    "start": to_j_instant("2035-01-31T12:30:00.12345Z"),
                    "end": to_j_instant("2035-01-31T12:30:00.12346Z"),
                },
                "timezone": None,
            },
            {
                "start": "2053859400123450000",
                "end": "2053859400123460000",
                "isStartNanoseconds": True,
                "isEndNanoseconds": True,
            },
        )
        # mixed java date range
        verify_date_range_conversion(
            {
                "value": {
                    "start": to_j_local_date("2035-01-31"),
                    "end": to_j_instant("2035-01-31T12:30:00.12345Z"),
                },
                "timezone": None,
            },
            {
                "start": "2035-01-31",
                "end": "2053859400123450000",
                "isStartNanoseconds": False,
                "isEndNanoseconds": True,
            },
        )

        # gets timezone info from date if available
        verify_date_converted_to_nanos(
            {
                "value": to_j_zdt("2035-01-31T12:30:00.12345 America/New_York"),
                "timezone": None,
            },
            "2053877400123450000",
            "America/New_York",
        )
        # respects timezone prop set by user
        verify_date_converted_to_nanos(
            {
                "value": to_j_zdt("2035-01-31T12:30:00.12345 America/New_York"),
                "timezone": "User Timezone",
            },
            "2053877400123450000",
            "User Timezone",
        )
        # uses timezone info from either start or end date in range
        verify_date_range_conversion(
            {
                "value": {
                    "start": to_j_local_date("2035-01-31"),
                    "end": to_j_zdt("2035-01-31T12:30:00.12345 America/New_York"),
                },
                "timezone": None,
            },
            {
                "start": "2035-01-31",
                "end": "2053877400123450000",
                "isStartNanoseconds": False,
                "isEndNanoseconds": True,
            },
            "America/New_York",
        )
        # uses timezone info from start date if both dates have timezone info
        verify_date_range_conversion(
            {
                "value": {
                    "start": to_j_zdt("2035-01-31T9:30:00.12345 America/Los_Angeles"),
                    "end": to_j_zdt("2035-01-31T12:30:00.12345 America/New_York"),
                },
                "timezone": None,
            },
            {
                "start": "2053877400123450000",
                "end": "2053877400123450000",
                "isStartNanoseconds": True,
                "isEndNanoseconds": True,
            },
            "America/Los_Angeles",
        )


if __name__ == "__main__":
    unittest.main()
