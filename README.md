# syncdocs

Docs that automatically sync with your code.

syncdocs builds a call graph from your TypeScript/JavaScript codebase and generates documentation from static analysis. When code changes, docs get flagged as stale and can be regenerated with a single command.

Documentation lives in your repo (in `_syncdocs/` by default), tracks dependencies via content hashes, and includes an interactive flow graph viewer.

## Quick Start

```bash
npm install syncdocs
```

Initialize syncdocs in your project (interactive wizard):

```bash
npx syncdocs init
```

Generate docs:

```bash
npx syncdocs sync
```

## Commands

### `syncdocs init`

Initialize syncdocs in your project. Creates a `_syncdocs/config.yaml` with your preferred output directory and file scope.

### `syncdocs sync [target]`

Build a call graph and generate documentation. Analyzes all source files, extracts symbols and their relationships, writes `graph.json`, and generates a markdown doc for each symbol.

```bash
syncdocs sync              # sync all files in scope
syncdocs sync src/api/     # sync only files under src/api/
```

### `syncdocs check`

Check for stale documentation. Compares current code hashes against stored doc hashes and reports any that are out of sync. Returns exit code 1 if stale docs are found (CI-friendly).

```bash
syncdocs check        # report stale docs
```

### `syncdocs status [--verbose]`

Show documentation coverage for your project, including a suggestion for what to document next.

```bash
syncdocs status            # coverage summary
syncdocs status --verbose  # include full list of undocumented symbols
```

### `syncdocs serve [--port <number>]`

Start an interactive documentation viewer in your browser. Displays a flow graph of your codebase with clickable nodes that open symbol documentation in a side panel.

```bash
syncdocs serve              # default port 3456
syncdocs serve --port 8080
```

## How it works

1. **Extract** - The TypeScript compiler API parses source files and extracts symbols (functions, classes, arrow functions)
2. **Match** - Framework matchers identify entry points (Next.js routes, Inngest functions, Trigger.dev tasks)
3. **Graph** - A call graph is built from static analysis, tracking direct calls, async dispatches, and other connections between symbols
4. **Generate** - Static markdown documentation is generated for each node in the graph, including call relationships and entry point metadata
5. **Hash** - Symbol content is SHA256 hashed so changes can be detected
6. **Check** - Compare stored hashes against current code to detect when docs are out of sync

## Configuration

`_syncdocs/config.yaml`:

```yaml
output:
  dir: _syncdocs

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
git clone https://github.com/fredrivett/syncdocs
cd syncdocs
npm install
```

```bash
npm run dev          # watch mode
npm run build        # build to dist/
npm test             # run tests
npm run format       # format with biome
```
