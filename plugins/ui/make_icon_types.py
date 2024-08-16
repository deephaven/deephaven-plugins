import re


def camel_to_snake(name: str) -> str:
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


relative_path = "./src/js/node_modules/@deephaven/icons/dist/index.d.ts"

icons = {}
snakeCase = {}
noPrefix = {}
snakeCaseNoPrefix = {}

with open(relative_path, "r") as file:
    lines = file.readlines()
    for line in lines:
        if "IconDefinition" in line:
            icon = line.split(" ")[2].strip()[:-1]
            if icon != "IconDefinition":
                icons[icon] = icon
                snakeCase[camel_to_snake(icon)] = icon

                noPrefixIcon = icon[2:]
                if noPrefixIcon in noPrefix:
                    if noPrefixIcon.startswith("vs"):
                        noPrefix[noPrefixIcon] = icon
                else:
                    noPrefix[noPrefixIcon] = icon

                snakeCaseNoPrefixIcon = camel_to_snake(noPrefixIcon)
                if snakeCaseNoPrefixIcon in snakeCaseNoPrefix:
                    if icon.startswith("vs"):
                        snakeCaseNoPrefix[snakeCaseNoPrefixIcon] = icon
                else:
                    snakeCaseNoPrefix[snakeCaseNoPrefixIcon] = icon

output_file_path = "./src/deephaven/ui/components/types/icon_types.py"

with open(output_file_path, "w") as output_file:
    output_file.truncate(0)

    output_file.write(
        "from __future__ import annotations"
        + "\n"
        + "from typing import Literal"
        + "\n\n"
    )

    ## IconTypes
    output_file.write("IconTypes = Literal[" + "\n")
    for key, value in icons.items():
        output_file.write('    "' + key + '",' + "\n")

    for key, value in noPrefix.items():
        output_file.write('    "' + key + '",' + "\n")

    for key, value in snakeCase.items():
        output_file.write('    "' + key + '",' + "\n")

    for key, value in snakeCaseNoPrefix.items():
        output_file.write('    "' + key + '",' + "\n")
    output_file.write("]" + "\n")

    ## IconMapping
    output_file.write("\n")
    output_file.write("IconMapping = {" + "\n")
    for key, value in icons.items():
        output_file.write('    "' + key + '": "' + value + '",' + "\n")

    for key, value in noPrefix.items():
        output_file.write('    "' + key + '": "' + value + '",' + "\n")

    for key, value in snakeCase.items():
        output_file.write('    "' + key + '": "' + value + '",' + "\n")

    for key, value in snakeCaseNoPrefix.items():
        output_file.write('    "' + key + '": "' + value + '",' + "\n")
    output_file.write("}" + "\n")
