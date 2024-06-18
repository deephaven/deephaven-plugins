import os

BUILT_DOCS = "docs/build/markdown"

# save original directory so we can return to it
cwd = os.getcwd()

# change to the directory of this file
dirname = os.path.dirname(__file__)
os.chdir(dirname)

os.system("make clean")

print("Building markdown")
os.system("make markdown")

print("Copying assets")
os.system(f"cp -r docs/_assets {BUILT_DOCS}/_assets")
os.system(f"cp docs/sidebar.json {BUILT_DOCS}/sidebar.json")

os.system(f"rm {BUILT_DOCS}/index.md")

try:
    # go through each markdown file, look for ### deephaven.plot.express then add the syntax block
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

finally:
    # ensure we always return to the original directory, even if an exception is raised
    os.chdir(cwd)
