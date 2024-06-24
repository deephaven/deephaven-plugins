import os

BUILT_DOCS = "docs/build/markdown"

os.system("make clean")

print("Building markdown")
os.system("make markdown")

print("Copying assets")
os.system(f"cp -r docs/_assets {BUILT_DOCS}/_assets")
os.system(f"cp docs/sidebar.json {BUILT_DOCS}/sidebar.json")

os.system(f"rm {BUILT_DOCS}/index.md")

for root, dirs, files in os.walk(BUILT_DOCS):
    for file in files:
        if file.endswith(".md"):
            with open(os.path.join(root, file), "r") as f:
                lines = f.readlines()
            with open(os.path.join(root, file), "w") as f:
                for line in lines:
                    if "<ParamTable param={{" in line:
                        # remove the comment markers
                        # these are added in deephaven_autodoc.py to prevent special characters from being escaped
                        # by the markdown renderer
                        line = line.replace("<!-- ", "")
                        line = line.replace(" -->", "")
                    f.write(line)
