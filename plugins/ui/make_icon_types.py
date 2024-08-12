relative_path = "./src/js/node_modules/@deephaven/icons/dist/index.d.ts"

icons = []

with open(relative_path, "r") as file:
    lines = file.readlines()
    for line in lines:
        if "IconDefinition" in line:
            icon = line.split(" ")[2].strip()[:-1]
            if icon != "IconDefinition":
                icons.append(icon)

output_file_path = "./src/deephaven/ui/components/types/icon_types.py"

with open(output_file_path, "w") as output_file:
    output_file.truncate(0)

    output_file.write(
        "from __future__ import annotations"
        + "\n"
        + "from typing import Literal"
        + "\n\n"
    )
    output_file.write("IconTypes = Literal[" + "\n")
    for icon in icons:
        output_file.write('    "' + icon + '"\n')

    output_file.write("]" + "\n")
