"""Coverage matrix tool. Checks that every parameter of each TVL chart-type
function appears either as a kwarg in a code block on its primary doc page or
in a `coverage-seen-elsewhere` annotation.

Usage:
    python tools/build_coverage_matrix.py            # print matrix
    python tools/build_coverage_matrix.py --check    # exit 1 if missing
"""
from __future__ import annotations
import ast
import inspect
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

# Map of page -> (function dotted path, expected primary symbol attr)
PAGES = {
    "candlestick.md": "candlestick",
    "bar.md": "bar",
    "line.md": "line",
    "area.md": "area",
    "baseline.md": "baseline",
    "histogram.md": "histogram",
    "yield-curve.md": "yield_curve",
    "options-chart.md": "options_chart",
    "custom-numeric.md": "custom_numeric",
}


def parse_signature_params(src_file: Path, func_name: str) -> list[str]:
    """Parse a Python source file with ast and return the parameter names of
    the named top-level function."""
    tree = ast.parse(src_file.read_text())
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == func_name:
            args = node.args
            names = [a.arg for a in args.args]
            return [n for n in names if n != "self"]
    raise KeyError(f"function {func_name} not found in {src_file}")


CHART_PY = ROOT / "src" / "deephaven" / "plot" / "tradingview_lightweight" / "chart.py"


def extract_code_blocks(md: str) -> list[str]:
    """Return all python code-block bodies."""
    pat = re.compile(r"```python[^\n]*\n(.*?)```", re.DOTALL)
    return pat.findall(md)


def extract_seen_elsewhere(md: str) -> dict[str, str]:
    """Parse the `coverage-seen-elsewhere` HTML comment at the top of the file."""
    m = re.search(r"<!--\s*coverage-seen-elsewhere:(.*?)-->", md, re.DOTALL)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or "->" not in line:
            continue
        k, v = [s.strip() for s in line.split("->", 1)]
        out[k] = v
    return out


def kwarg_used(param: str, blocks: list[str]) -> bool:
    """Return True if param appears as `param=` anywhere in any block."""
    pat = re.compile(rf"\b{re.escape(param)}\s*=")
    return any(pat.search(b) for b in blocks)


def main():
    check_mode = "--check" in sys.argv

    missing_total = 0
    print("# TVL Docs Coverage Matrix\n")
    for page_fname, func_name in PAGES.items():
        page_path = DOCS / page_fname
        if not page_path.exists():
            print(f"## {page_fname}: MISSING FILE")
            missing_total += 1
            continue
        params = parse_signature_params(CHART_PY, func_name)
        # drop `table` (positional, no kwarg form expected)
        params = [p for p in params if p != "table"]
        md = page_path.read_text()
        blocks = extract_code_blocks(md)
        elsewhere = extract_seen_elsewhere(md)

        print(f"## {page_fname} -> tvl.{func_name}\n")
        print("| Parameter | Seen in |")
        print("|---|---|")
        page_missing = []
        for p in params:
            if kwarg_used(p, blocks):
                print(f"| {p} | {page_fname} |")
            elif p in elsewhere:
                print(f"| {p} | {elsewhere[p]} (via annotation) |")
            else:
                print(f"| {p} | **MISSING** |")
                page_missing.append(p)
        print()
        if page_missing:
            missing_total += len(page_missing)

    if check_mode and missing_total:
        sys.exit(1)


if __name__ == "__main__":
    main()
