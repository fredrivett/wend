# treck

Your codebase, visualised.

Evergreen maps of every code flow. Always in sync.

From button click, to API call, to background task, to database update — trace the whole flow end-to-end.

## Quick Start

```bash
npm install treck
```

Initialize treck in your project (interactive wizard):

```bash
npx treck init
```

Build the graph:

```bash
npx treck sync
```

## Commands

### `treck init`

Initialize treck in your project. Creates a `_treck/config.yaml` with your preferred output directory and file scope.

### `treck sync [target]`

Build the dependency graph. Analyzes all source files, extracts symbols and their relationships, and writes `graph.json`.

```bash
treck sync              # sync all files in scope
treck sync src/api/     # sync only files under src/api/
```

### `treck check`

Check graph freshness. Compares current code hashes against the hashes stored in `graph.json` and reports any that are out of sync. Returns exit code 1 if stale nodes are found (CI-friendly).

```bash
treck check        # report stale nodes
```

### `treck status [--verbose]`

Show JSDoc coverage for your project.

```bash
treck status            # coverage summary
treck status --verbose  # include full list of symbols missing JSDoc
```

### `treck serve [--port <number>]`

Start an interactive documentation viewer in your browser. Displays a flow graph of your codebase with clickable nodes that open symbol documentation in a side panel.

```bash
treck serve              # default port 3456
treck serve --port 8080
```

## How it works

1. **Map** — Treck walks your source files and finds every symbol: functions, classes, handlers, tasks
2. **Connect** — It traces the calls between them, building a graph of how everything fits together
3. **Detect** — Each symbol is hashed, so when code changes, treck knows exactly what's gone stale
4. **Explore** — Browse the graph in an interactive viewer, or check freshness in CI

Currently supports TypeScript and JavaScript, with framework-aware entry points for Next.js, Inngest, and Trigger.dev.

## Configuration

`_treck/config.yaml`:

```yaml
output:
  dir: _treck

scope:
  include:
    - src/**/*.{ts,tsx,js,jsx}
  exclude:
    - **/*.test.ts
    - **/*.spec.ts
    - node_modules/**
    - dist/**
    - build/**
```

## Known Limitations

- **Dynamic dispatch** — Static analysis can't resolve which function a variable points to at runtime. For example, `const fn = cond ? adminHandler : userHandler; fn()` will show `fn()` as an unconditional call without knowing which handler it refers to.
- **Switch fall-through (non-empty cases)** — Empty cases that fall through are grouped correctly (`case 'a': case 'b': foo()` → `case 'a' | 'b'`), but fall-through from cases that have statements without `break`/`return` is not detected. Those calls are attributed only to the case they appear in, not to preceding cases that fall through.

## Contributing

```bash
git clone https://github.com/fredrivett/treck
cd treck
npm install
```

```bash
npm run dev          # watch mode
npm run build        # build to dist/
npm test             # run tests
npm run format       # format with biome
```
