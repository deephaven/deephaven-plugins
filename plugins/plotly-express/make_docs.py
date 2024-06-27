import os

BUILT_DOCS = "docs/build/markdown"

# save original directory so we can return to it
cwd = os.getcwd()

# change to the directory of this file
dirname = os.path.dirname(__file__)
if dirname:
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
                        if line.startswith("<!-- <ParamTable param={{"):
                            # remove the comment markers
                            # these are added in deephaven_autodoc.py to prevent special characters from being escaped
                            # by the markdown renderer
                            line = line.replace("<!-- ", "")
                            line = line.replace(" -->", "")
                        f.write(line)

finally:
    # ensure we always return to the original directory, even if an exception is raised
    os.chdir(cwd)
