import unittest
from unittest.mock import patch

import pandas as pd
from deephaven_server import Server


def remap_types(
    df: pd.DataFrame,
) -> None:
    """
    Remap the types of the columns to the correct types

    Args:
        df: The dataframe to remap the types of
    """
    for col in df.columns:
        if df[col].dtype == "int64":
            df[col] = df[col].astype("Int64")
        elif df[col].dtype == "float64":
            df[col] = df[col].astype("Float64")


class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.setup_exporter_mock()

    @classmethod
    @patch("deephaven.plugin.object_type.Exporter")
    @patch("deephaven.plugin.object_type.Reference")
    def setup_exporter_mock(cls, MockExporter, MockReference):
        cls.exporter = MockExporter()
        cls.reference = MockReference()

        cls.reference.id = 0
        cls.exporter.reference.return_value = MockReference()


if __name__ == "__main__":
    unittest.main()
