from re import fullmatch
from subprocess import run
from sys import exit


def main():
    print("Checking TypeScript types...")
    res = run(
        ["npx", "tsc", "-p", ".", "--emitDeclarationOnly", "false", "--noEmit"],
        capture_output=True,
    )

    if res.returncode == 0:
        return 0

    messages = []
    for line in res.stdout.decode("utf-8").splitlines():
        if len(line) == 0:
            continue
        # If there's an indent, that means it's a continuation of the previous line
        # For example, the error message could be like:
        # > Argument of type 'FUNCTION_1_TYPE | undefined' is not assignable to parameter of type 'FUNCTION_2_TYPE'.
        # >   Type 'FUNCTION_1_TYPE' is not assignable to type 'FUNCTION_2_TYPE'.
        # >     Types of parameters `PARAM_1` and `PARAM_2` are incompatible.
        # >       Type 'PARAM_1_TYPE' is not assignable to type 'PARAM_2_TYPE'.
        if line[0] == " " and len(messages) > 0:
            messages[-1] += "\n" + line
        else:
            messages.append(line)

    for message in messages:
        # Check if the message is actually an error and extract the details
        # Error message format: file(line,col): error_message
        match = fullmatch(r"(.+?)\((\d+),(\d+)\): ([\s\S]+)", message)
        if match is None:
            continue

        file, line, col, error_message = match.groups()
        # Newlines in GitHub Actions annotations are escaped as %0A
        # https://github.com/actions/toolkit/issues/193#issuecomment-605394935
        error_message = error_message.replace("\n", "%0A")
        # GitHub Actions annotation format
        print(f"::error file={file},line={line},col={col}::{error_message}")

    return res.returncode


if __name__ == "__main__":
    # Exit with returncode so GitHub Actions fails properly
    exit(main())
