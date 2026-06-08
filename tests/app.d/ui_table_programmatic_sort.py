from deephaven import ui, new_table
from deephaven.column import int_col, string_col


data = new_table(
    [
        string_col("Name", [f"R{i:02d}" for i in range(1, 21)]),
        int_col(
            "SepalLength",
            [
                51,
                -49,
                64,
                58,
                -32,
                47,
                53,
                -41,
                60,
                55,
                -28,
                62,
                44,
                -36,
                57,
                50,
                -22,
                59,
                46,
                -30,
            ],
        ),
    ]
)


t_programmatic_sort_asc = ui.table(
    data,
    sorts=ui.TableSort(column="SepalLength", direction="ASC"),
)
