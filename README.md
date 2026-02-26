# wend

> _wend_ (v.) Old English: to turn, to go one's way

Find the way through your code.

Wend maps how your codebase connects — every function, every call, every path between them.

## Quick Start

```bash
npm install wend
```

Initialize wend in your project (interactive wizard):

```bash
npx wend init
```

Build the graph:

```bash
npx wend sync
```

## Commands

### `wend init`

Initialize wend in your project. Creates a `_wend/config.yaml` with your preferred output directory and file scope.

### `wend sync [target]`

Build the dependency graph. Analyzes all source files, extracts symbols and their relationships, and writes `graph.json`.

```bash
wend sync              # sync all files in scope
wend sync src/api/     # sync only files under src/api/
```

### `wend check`

Check graph freshness. Compares current code hashes against the hashes stored in `graph.json` and reports any that are out of sync. Returns exit code 1 if stale nodes are found (CI-friendly).

```bash
wend check        # report stale nodes
```

### `wend status [--verbose]`

Show JSDoc coverage for your project.

```bash
wend status            # coverage summary
wend status --verbose  # include full list of symbols missing JSDoc
```

### `wend serve [--port <number>]`

Start an interactive documentation viewer in your browser. Displays a flow graph of your codebase with clickable nodes that open symbol documentation in a side panel.

```bash
wend serve              # default port 3456
wend serve --port 8080
```

## How it works

1. **Map** — Wend walks your source files and finds every symbol: functions, classes, handlers, tasks
2. **Connect** — It traces the calls between them, building a graph of how everything fits together
3. **Detect** — Each symbol is hashed, so when code changes, wend knows exactly what's gone stale
4. **Explore** — Browse the graph in an interactive viewer, or check freshness in CI

Currently supports TypeScript and JavaScript, with framework-aware entry points for Next.js, Inngest, and Trigger.dev.

## Configuration

`_wend/config.yaml`:

```yaml
output:
  dir: _wend

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
git clone https://github.com/fredrivett/wend
cd wend
npm install
```

```bash
npm run dev          # watch mode
npm run build        # build to dist/
npm test             # run tests
npm run format       # format with biome
```
