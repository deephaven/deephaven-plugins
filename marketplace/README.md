# Plugin marketplace

`marketplace.json` is the source of truth for the plugin directory shown at [deephaven.io/plugins](https://deephaven.io/plugins). On merge to `main` this folder is synced to S3 and the website reads it from there, so a merged PR is all it takes to list, update, or remove a plugin.

## Add your plugin

1. Add an entry to the `plugins` array in [`marketplace.json`](./marketplace.json). The fields are documented in [`marketplace.schema.json`](./marketplace.schema.json); editors that understand `$schema` will autocomplete and validate as you type. The required fields are `name`, `description`, `author`, `repo`, and `image`:

   ```json
   {
     "name": "My Plugin",
     "description": "One sentence describing what it does, shown on the card.",
     "author": "your-github-handle",
     "repo": "https://github.com/your-github-handle/your-plugin",
     "image": "/marketplace/images/my-plugin.png",
     "registry": {
       "kind": "pypi",
       "package": "deephaven-plugin-my-plugin",
       "url": "https://pypi.org/project/deephaven-plugin-my-plugin/"
     },
     "tags": ["python"]
   }
   ```

2. Add a card image to [`images/`](./images) and reference it as `/marketplace/images/<file>.png`. It must be a PNG committed to that folder (external URLs are not allowed); keep it under 300 KB and roughly 16:9 (600×338 works well).

3. Validate locally, then open a PR:

   ```sh
   npm run validate-marketplace
   ```

   CI runs the same check on every PR that touches this folder and blocks merge until it passes. Use `npm run validate-marketplace -- --skip-links` to skip the (slower) external link checks while iterating.

## What the validator enforces

Beyond the JSON schema, [`tools/validate-marketplace.mjs`](../tools/validate-marketplace.mjs) checks that:

- plugin names are unique,
- the `repo` owner matches the `author` (the author drives the official badge),
- the `official` tag and `preInstalled` flag are reserved for Deephaven-owned plugins,
- each plugin's `image` is a PNG that exists directly in `images/` and is under 300 KB,
- no image in `images/` is orphaned (unreferenced by any plugin), and
- every link resolves: `repo`, `href`, `registry.url`, and the author's GitHub profile.

## Reserved fields

`author: "deephaven"` plugins get the official badge automatically, and only they may set `preInstalled: true`. Don't add the `official` tag by hand; it is derived from the author.
