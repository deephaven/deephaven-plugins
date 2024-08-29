import re
from typing import Dict, Any


def camel_to_snake(name: str) -> str:
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def update_dict(
    dictionary: Dict[str, str], key: str, value: str, overwrite_condition: bool
) -> None:
    if overwrite_condition or not key in dictionary:
        dictionary[key] = value


relative_path = "./src/js/node_modules/@deephaven/icons/dist/index.d.ts"
icon_pattern = r"^export const (\w+): IconDefinition;$"

icons = {}
snakeCase = {}
noPrefix = {}
snakeCaseNoPrefix = {}

with open(relative_path, "r") as file:
    for line in file:
        match = re.match(icon_pattern, line)
        if match:
            icon = line.split(" ")[2].strip()[:-1]
            if icon != "IconDefinition":
                icons[icon] = icon
                snakeCase[camel_to_snake(icon)] = icon

                isVsIcon = icon.startswith("vs")
                noPrefixIcon = icon[2:]
                update_dict(noPrefix, noPrefixIcon, icon, isVsIcon)

                snakeCaseNoPrefixIcon = camel_to_snake(noPrefixIcon)
                update_dict(snakeCaseNoPrefix, snakeCaseNoPrefixIcon, icon, isVsIcon)

output_file_path = "./src/deephaven/ui/components/types/icon_types.py"

with open(output_file_path, "w") as output_file:
    output_file.truncate(0)

    output_file.write(
        "from __future__ import annotations\n" + "from typing import Literal\n\n"
    )

    ## IconTypes
    output_file.write("IconTypes = Literal[\n")
    for key, value in snakeCaseNoPrefix.items():
        output_file.write('    "' + key + '",' + "\n")
    for key, value in snakeCase.items():
        if key.startswith("dh"):
            output_file.write('    "' + key + '",' + "\n")
    output_file.write("]" + "\n")

    ## IconMapping
    output_file.write("\n")
    output_file.write("IconMapping = {" + "\n")
    for dict in [icons, noPrefix, snakeCase, snakeCaseNoPrefix]:
        for key, value in dict.items():
            output_file.write('    "' + key + '": "' + value + '",' + "\n")
    output_file.write("}" + "\n")


print(f"Generated file: {output_file_path}")
print(f"Total number of icon types: {len(snakeCaseNoPrefix)}")
print(
    f"Total number of icon mappings: {len(icons) + len(noPrefix) + len(snakeCase) + len(snakeCaseNoPrefix)}"
)
