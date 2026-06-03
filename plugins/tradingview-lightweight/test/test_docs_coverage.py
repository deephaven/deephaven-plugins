"""Docs coverage tests for the tradingview-lightweight plugin.

Implements the seven test cases described in
``notes/subplan-coverage.md`` section B. These exercise the same matrix
logic as ``tools/build_coverage_matrix.py`` but as unit tests.

The tests do not require a running Deephaven server. The plugin's
``deephaven.plugin*`` host modules are mocked, and chart.py's optional
``deephaven.table.Table`` import is caught and falls through to ``None``.
"""

from __future__ import annotations

import importlib.util
import inspect
import json
import os
import re
import sys
import typing
import unittest
from pathlib import Path
from typing import Iterable
from unittest.mock import MagicMock

# Wire src/ on the path and mock plugin host modules so the package imports.
PLUGIN_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PLUGIN_ROOT / "src"
sys.path.insert(0, str(SRC_DIR))

sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot import tradingview_lightweight as tvl  # noqa: E402

# Load tools/build_coverage_matrix.py as a module so we can reuse its parsers.
_BCM_SPEC = importlib.util.spec_from_file_location(
    "_bcm", PLUGIN_ROOT / "tools" / "build_coverage_matrix.py"
)
assert _BCM_SPEC and _BCM_SPEC.loader
bcm = importlib.util.module_from_spec(_BCM_SPEC)
_BCM_SPEC.loader.exec_module(bcm)


DOCS = PLUGIN_ROOT / "docs"
SNAPSHOTS = DOCS / "snapshots"
ASSETS = SNAPSHOTS / "assets"
SIDEBAR = DOCS / "sidebar.json"

# Chart-type pages -> primary function name. Reuses the canonical mapping in
# build_coverage_matrix.PAGES.
CHART_TYPE_PAGES: dict[str, str] = dict(bcm.PAGES)
CHART_TYPE_FUNCS = set(CHART_TYPE_PAGES.values())

# Public Literal-alias names exposed from options.py. These are the "enums"
# whose value membership we check via typing.get_args().
ENUM_NAMES = [
    "ChartType",
    "ColorSpace",
    "ColorType",
    "PriceFormatter",
    "TickmarksPriceFormatter",
    "PercentageFormatter",
    "TickmarksPercentageFormatter",
    "PrecomputeConflationPriority",
    "LineStyle",
    "LineType",
    "LineWidth",
    "CrosshairMode",
    "HorzAlign",
    "PriceScaleMode",
    "MarkerShape",
    "MarkerPosition",
    "LastPriceAnimationMode",
    "MarkerSign",
    "MismatchDirection",
    "PriceLineSource",
    "TickMarkType",
    "TrackingModeExitMode",
    "VertAlign",
]


def _all_md_files() -> list[Path]:
    return sorted(DOCS.glob("*.md"))


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def _all_code_blocks() -> list[str]:
    """Every python code-block body across all docs/*.md files."""
    out: list[str] = []
    for p in _all_md_files():
        out.extend(bcm.extract_code_blocks(_read(p)))
    return out


def _all_dhautofunction_targets() -> set[str]:
    """Every dotted symbol referenced by a ``.. dhautofunction::`` directive."""
    pat = re.compile(r"\.\.\s*dhautofunction::\s*([\w.]+)")
    out: set[str] = set()
    for p in _all_md_files():
        for m in pat.finditer(_read(p)):
            out.add(m.group(1))
    return out


def _name_mentioned_anywhere(name: str) -> bool:
    """True if ``name`` appears as a word in any docs/*.md file (anywhere —
    prose, code block, or dhautofunction directive)."""
    pat = re.compile(rf"\b{re.escape(name)}\b")
    for p in _all_md_files():
        if pat.search(_read(p)):
            return True
    return False


class TestSymbolCoverage(unittest.TestCase):
    """Test 1 — every name in ``__all__`` appears in at least one .md file."""

    def test_symbol_coverage(self) -> None:
        missing: list[str] = []
        for name in tvl.__all__:
            if not _name_mentioned_anywhere(name):
                missing.append(name)
        self.assertEqual(
            missing,
            [],
            f"Public symbols not mentioned in any docs/*.md: {missing}",
        )


class TestParameterCoverage(unittest.TestCase):
    """Test 2 — for each chart-type function, every parameter is covered by
    a kwarg in a code block on its primary page or a coverage-seen-elsewhere
    annotation pointing at a real page."""

    def test_parameter_coverage(self) -> None:
        all_md = {p.name for p in _all_md_files()}
        missing: dict[str, list[str]] = {}

        for page_fname, func_name in CHART_TYPE_PAGES.items():
            page_path = DOCS / page_fname
            self.assertTrue(
                page_path.exists(), f"Expected page does not exist: {page_fname}"
            )
            params = bcm.parse_signature_params(bcm.CHART_PY, func_name)
            params = [p for p in params if p != "table"]
            md = _read(page_path)
            blocks = bcm.extract_code_blocks(md)
            elsewhere = bcm.extract_seen_elsewhere(md)

            # Each elsewhere target must resolve to a real page.
            for k, v in elsewhere.items():
                self.assertIn(
                    v,
                    all_md,
                    f"{page_fname}: coverage-seen-elsewhere for {k!r} points "
                    f"to {v!r}, which is not a real docs page",
                )

            page_missing: list[str] = []
            for p in params:
                if bcm.kwarg_used(p, blocks):
                    continue
                if p in elsewhere:
                    continue
                page_missing.append(p)
            if page_missing:
                missing[page_fname] = page_missing

        self.assertEqual(
            missing,
            {},
            f"Parameters with no docs coverage: {missing}",
        )


class TestEnumCoverage(unittest.TestCase):
    """Test 3 — for each Literal alias, every value appears in at least one
    code block somewhere in the docs."""

    def test_enum_coverage(self) -> None:
        blocks = _all_code_blocks()
        missing: dict[str, list[object]] = {}
        for enum_name in ENUM_NAMES:
            alias = getattr(tvl, enum_name)
            values = typing.get_args(alias)
            self.assertGreater(len(values), 0, f"{enum_name} has no Literal args")
            unseen: list[object] = []
            for v in values:
                if isinstance(v, str):
                    # Quoted string literal in a code block.
                    pat = re.compile(rf"""['"]{re.escape(v)}['"]""")
                elif isinstance(v, int):
                    # Bare int literal — word-boundary match.
                    pat = re.compile(rf"\b{v}\b")
                else:
                    unseen.append(v)
                    continue
                if not any(pat.search(b) for b in blocks):
                    unseen.append(v)
            if unseen:
                missing[enum_name] = unseen
        self.assertEqual(
            missing,
            {},
            f"Enum/Literal values not used in any code block: {missing}",
        )


class TestAssetReferenceIntegrity(unittest.TestCase):
    """Test 4 — every image path referenced in a snapshot JSON resolves to a
    real file under docs/snapshots/assets/."""

    def test_asset_reference_integrity(self) -> None:
        if not SNAPSHOTS.exists():
            self.skipTest("docs/snapshots/ does not exist")
        broken: list[str] = []
        for jf in sorted(SNAPSHOTS.glob("*.json")):
            try:
                doc = json.loads(jf.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                self.fail(f"{jf.name}: invalid JSON ({e})")
            objects = doc.get("objects") or {}
            # `objects` is a dict keyed by `order=` name; iterate its values.
            # Some entries (e.g. salmon's `:log` type) carry a string `data`
            # rather than a dict — only TvlChart entries point at an asset.
            for obj in objects.values():
                data = obj.get("data") if isinstance(obj, dict) else None
                if not isinstance(data, dict):
                    continue
                image = data.get("image")
                if not image:
                    continue
                # `image` is expected to be a path relative to docs/snapshots/.
                target = (SNAPSHOTS / image).resolve()
                if not target.exists():
                    broken.append(f"{jf.name} -> {image}")
        self.assertEqual(
            broken,
            [],
            f"Snapshot JSONs reference missing assets: {broken}",
        )


class TestNoOrphanAssets(unittest.TestCase):
    """Test 5 — every PNG under docs/snapshots/assets/ is referenced by at
    least one JSON under docs/snapshots/."""

    def test_no_orphan_assets(self) -> None:
        if not ASSETS.exists():
            self.skipTest("docs/snapshots/assets/ does not exist")
        pngs = sorted(ASSETS.glob("*.png"))
        if not pngs:
            self.skipTest("no PNG assets present")
        # Collect every image-path string referenced by any snapshot JSON.
        referenced: set[Path] = set()
        for jf in sorted(SNAPSHOTS.glob("*.json")):
            try:
                doc = json.loads(jf.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            objects = doc.get("objects") or {}
            for obj in objects.values():
                data = obj.get("data") if isinstance(obj, dict) else None
                if not isinstance(data, dict):
                    continue
                image = data.get("image")
                if image:
                    referenced.add((SNAPSHOTS / image).resolve())
        orphans = [p.name for p in pngs if p.resolve() not in referenced]
        self.assertEqual(
            orphans,
            [],
            f"PNG assets not referenced by any snapshot JSON: {orphans}",
        )


class TestSidebarHasEveryPage(unittest.TestCase):
    """Test 6 — every docs/*.md file (except README.md) appears in
    sidebar.json under some item's ``path`` field."""

    @staticmethod
    def _walk_paths(node: object) -> Iterable[str]:
        if isinstance(node, dict):
            if isinstance(node.get("path"), str):
                yield node["path"]
            for v in node.values():
                yield from TestSidebarHasEveryPage._walk_paths(v)
        elif isinstance(node, list):
            for item in node:
                yield from TestSidebarHasEveryPage._walk_paths(item)

    def test_sidebar_has_every_page(self) -> None:
        self.assertTrue(SIDEBAR.exists(), "docs/sidebar.json is missing")
        doc = json.loads(SIDEBAR.read_text(encoding="utf-8"))
        sidebar_paths = set(self._walk_paths(doc))
        missing: list[str] = []
        for md in _all_md_files():
            if md.name == "README.md":
                continue
            if md.name not in sidebar_paths:
                missing.append(md.name)
        self.assertEqual(
            missing,
            [],
            f"Pages not listed in sidebar.json: {missing}",
        )


class TestDhautofunctionPerPublicSymbol(unittest.TestCase):
    """Test 7 — every callable in ``__all__`` appears at least once in an
    ``.. dhautofunction::`` directive.

    Relaxed rule (per task instructions): chart-type functions covered by the
    coverage matrix must have an explicit dhautofunction directive. Other
    callable ``__all__`` symbols (e.g. ``Marker``, ``PriceLine``,
    ``SeriesSpec``) only require their NAME to appear in a .md file, either
    in a code block or in a dhautofunction directive.
    """

    def test_dhautofunction_per_public_symbol(self) -> None:
        targets = _all_dhautofunction_targets()
        directive_names = {t.rsplit(".", 1)[-1] for t in targets}

        missing_strict: list[str] = []
        missing_lenient: list[str] = []

        for name in tvl.__all__:
            obj = getattr(tvl, name)
            if not callable(obj) or inspect.ismodule(obj):
                continue
            if name in CHART_TYPE_FUNCS:
                # Must have explicit dhautofunction directive.
                if name not in directive_names:
                    missing_strict.append(name)
            else:
                # Just needs to appear in some .md file.
                if not _name_mentioned_anywhere(name):
                    missing_lenient.append(name)

        self.assertEqual(
            missing_strict,
            [],
            f"Chart-type functions missing a dhautofunction directive: "
            f"{missing_strict}",
        )
        self.assertEqual(
            missing_lenient,
            [],
            f"Public callables not mentioned anywhere in docs: " f"{missing_lenient}",
        )


class TestOrderNamesAssigned(unittest.TestCase):
    """Test 8 — every name listed in a ``python order=...`` fence must be
    assigned at top level inside that block's body.

    Mismatches here used to silently crash the Pass-2 docs snapshot pipeline:
    the fixture generator looked up every order= name in the block's
    locals dict, and a `KeyError` for one name (e.g. order=sum but the
    code defined sum_chart) propagated through app.d evaluation and
    killed the whole JVM at server startup. Catch it at the doc-edit
    boundary instead.
    """

    @staticmethod
    def _assigned_names(body: str) -> set[str]:
        import ast

        names: set[str] = set()
        try:
            tree = ast.parse(body)
        except SyntaxError:
            return names
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for tgt in node.targets:
                    if isinstance(tgt, ast.Name):
                        names.add(tgt.id)
                    elif isinstance(tgt, ast.Tuple):
                        for el in tgt.elts:
                            if isinstance(el, ast.Name):
                                names.add(el.id)
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                names.add(node.target.id)
        return names

    def test_order_names_assigned(self) -> None:
        fence = re.compile(r"```python\s+([^\n]*)\n(.*?)```", re.DOTALL)
        order_re = re.compile(r"order=([\w,]+)")
        problems: list[str] = []
        for md in sorted(DOCS.glob("*.md")):
            text = md.read_text(encoding="utf-8")
            for m in fence.finditer(text):
                info, body = m.group(1), m.group(2)
                om = order_re.search(info)
                if not om:
                    continue
                order_names = [n for n in om.group(1).split(",") if n]
                assigned = self._assigned_names(body)
                missing = [n for n in order_names if n not in assigned]
                if missing:
                    problems.append(
                        f"{md.name}: order=({','.join(order_names)}) "
                        f"but missing assignments for {missing}"
                    )
        self.assertEqual(
            problems,
            [],
            "Code blocks have `order=` names that aren't assigned in the "
            "block body. These would crash the Pass-2 snapshotter:\n"
            + "\n".join(problems),
        )


if __name__ == "__main__":
    unittest.main()
