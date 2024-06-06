import os

os.system("make clean")

print("Building markdown")
os.system("make markdown")

print("Copying assets")
os.system("cp -r _assets build/markdown/_assets")
os.system("cp sidebar.json build/markdown/sidebar.json")

os.system("rm build/markdown/index.md")

# go through each markdown file, look for ### deephaven.plot.express then escape any < characters
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
