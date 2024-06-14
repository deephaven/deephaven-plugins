import os

BUILT_DOCS = "docs/build/markdown"

os.system("make clean")

print("Building markdown")
os.system("make markdown")

print("Copying assets")
os.system(f"cp -r docs/_assets {BUILT_DOCS}/_assets")
os.system(f"cp docs/sidebar.json {BUILT_DOCS}/sidebar.json")

os.system(f"rm {BUILT_DOCS}/index.md")

# go through each markdown file, look for ### deephaven.plot.express then escape any < characters
# this ensures function default values are shown
for root, dirs, files in os.walk(BUILT_DOCS):
    for file in files:
        if file.endswith(".md"):
            with open(os.path.join(root, file), "r") as f:
                lines = f.readlines()
            with open(os.path.join(root, file), "w") as f:
                for line in lines:
                    if "### deephaven.plot.express." in line:
                        # remove escaped \* with * as it's not needed when in a code block
                        line = line.replace("\\*", "*")
                        # first add the lines here
                        line = line.replace("### deephaven.plot.express.", "")
                        before = "<Syntax>\n\n```python\n"
                        after = "```\n\n</Syntax>\n"
                        line = before + line + after
                        # then here
                    f.write(line)
