# Syncdocs

Docs that automatically sync with your code.

## Development

- `npm run dev` — watch mode
- `npm run build` — build
- `npm test` — run tests
- `npm run format` — format with biome

## Changesets

Every PR must include a changeset. Run `npx changeset` before committing.

- Default to `patch` for all changes
- If you believe a change warrants a `minor` or `major` bump (new features, breaking changes), pause and suggest it to the user — do not select minor/major without explicit approval

## Code style

- Don't re-export types from wrapper files — update imports to point to the source directly, unless there's a good reason not to
