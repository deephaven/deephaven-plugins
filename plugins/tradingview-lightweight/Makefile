# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?= -c .
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = docs
BUILDDIR      = docs/build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile docs-snapshots

# Clean target: remove all files in BUILDDIR but keep directories
# Salmon preview tool uses docker volume mounts to share the markdown directory
# If the markdown directory is removed, the volume mount will break
clean:
	rm -rf $(BUILDDIR)/**/*

# Pass 2 docs snapshotter: captures widget PNGs for every `order=` block in
# docs/*.md, merges into docs/snapshots/<md5>.json, and prunes orphan assets.
# Requires a running Deephaven server (default http://localhost:10000).
# The image-snapshotter tool lives at the repo root; per-plugin selectors
# and widget type are passed via env.
docs-snapshots:
	cd ../../tools/image-snapshotter && npm install && npm run build && \
	  SNAPSHOTTER_PLUGIN_ROOT=$(CURDIR) \
	  SNAPSHOTTER_PLUGIN=tradingview-lightweight \
	  SNAPSHOTTER_TARGET_SELECTOR=.dh-tvl-chart \
	  SNAPSHOTTER_WIDGET_TYPE=deephaven.plot.tradingview_lightweight.TvlChart \
	  SNAPSHOTTER_APP_ID=tvl.docs.examples \
	  SNAPSHOTTER_APP_NAME='TVL Docs Examples' \
	  npx playwright test
	cd ../../tools/image-snapshotter && \
	  SNAPSHOTTER_PLUGIN_ROOT=$(CURDIR) \
	  node dist/cli.js --prune-only

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
