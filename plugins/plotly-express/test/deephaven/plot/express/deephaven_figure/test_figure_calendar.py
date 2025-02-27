from ..BaseTest import BaseTestCase


class FigureCalendarTestCase(BaseTestCase):
    def test_figure_calendar(self) -> None:
        from deephaven.plot.express.deephaven_figure.FigureCalendar import (
            FigureCalendar,
        )
        from deephaven.calendar import calendar

        calendar_name, calendar = "TestCalendar", calendar("TestCalendar")

        figure_calendar = FigureCalendar(calendar)

        calendar_name = figure_calendar._calendar.name()

        calendar_str_name = FigureCalendar(calendar_name)._calendar.name()

        calendar_default_name = FigureCalendar(True)._calendar.name()

        # since the default calendar is the same as the calendar set, all should be equal
        self.assertEqual(calendar_name, calendar_name)
        self.assertEqual(calendar_str_name, calendar_name)
        self.assertEqual(calendar_default_name, calendar_name)

        expected_timezone = "America/New_York"
        self.assertEqual(figure_calendar.timezone, expected_timezone)

        expected_business_days = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
        ]
        self.assertCountEqual(figure_calendar.business_days, expected_business_days)

        expected_weekend_days = ["SUNDAY", "SATURDAY"]
        self.assertCountEqual(figure_calendar.weekend_days, expected_weekend_days)

        expected_holidays = [
            {"date": "2024-01-01", "businessPeriods": []},
            {
                "date": "2024-04-01",
                "businessPeriods": [{"open": "08:00", "close": "12:00"}],
            },
        ]
        self.assertCountEqual(figure_calendar.holidays, expected_holidays)

        expected_business_periods = [{"open": "08:00", "close": "12:00"}]
        self.assertCountEqual(
            figure_calendar.business_periods, expected_business_periods
        )

        expected_calendar = {
            "timeZone": expected_timezone,
            "businessDays": expected_business_days,
            "holidays": expected_holidays,
            "businessPeriods": expected_business_periods,
        }

        calendar_dict = figure_calendar.__dict__()

        self.assert_calendar_equal(calendar_dict, expected_calendar)

    def test_figure_calendar_no_calendar(self) -> None:
        from deephaven.plot.express.deephaven_figure.FigureCalendar import (
            FigureCalendar,
        )

        figure_calendar = FigureCalendar(False)

        self.assertIsNone(figure_calendar.timezone)

        self.assertCountEqual(figure_calendar.business_days, [])

        self.assertCountEqual(figure_calendar.weekend_days, [])

        self.assertCountEqual(figure_calendar.holidays, [])

        self.assertCountEqual(figure_calendar.business_periods, [])

        self.assertIsNone(figure_calendar.__dict__())
