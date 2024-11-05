from subprocess import run
from re import fullmatch


def main():
    print("Checking TypeScript types...")
    res = run(
        ["npx", "tsc", "-p", ".", "--emitDeclarationOnly", "false", "--noEmit"],
        capture_output=True,
    )

    if res.returncode == 0:
        return

    errors = []
    for line in res.stdout.decode("utf-8").splitlines():
        if len(line) == 0:
            continue
        if line[0] == " " and len(errors) > 0:
            errors[-1] += "\n" + line
        else:
            errors.append(line)

    for err in errors:
        match = fullmatch(r"(.+?)\((\d+),(\d+)\): ([\s\S]+)", err)
        if match is None:
            continue

        file, line, col, msg = match.groups()
        msg = msg.replace("\n", "%0A")
        print(f"::error file={file},line={line},col={col}::{msg}")

    raise Exception("TypeScript type checking failed")


if __name__ == "__main__":
    main()
