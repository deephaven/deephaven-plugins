import os

os.system("cp -r _assets build/markdown/_assets")

# remove the index.md
os.system("rm build/markdown/index.md")

# go through each markdown file, look for ### deephaven.plot.express then excape any < characters
# this ensures function default values are shown
for root, dirs, files in os.walk("build/markdown"):
    for file in files:
        if file.endswith(".md"):
            with open(os.path.join(root, file), "r") as f:
                lines = f.readlines()
            with open(os.path.join(root, file), "w") as f:
                for line in lines:
                    if "### deephaven.plot.express" in line:
                        line = line.replace("<", "\\<")
                    f.write(line)
