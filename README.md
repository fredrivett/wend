# syncdocs

Docs that automatically sync with your code.

syncdocs generates AI-powered documentation for TypeScript/JavaScript symbols and keeps it in sync with your codebase. When code changes, docs get flagged as stale and can be regenerated automatically.

Documentation lives in your repo (in `_syncdocs/` by default), tracks dependencies via content hashes, and includes visual flow diagrams using mermaid.

## Quick Start

```bash
npm install syncdocs
```

Initialize syncdocs in your project (interactive wizard):

```bash
npx syncdocs init
```

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Generate your first docs:

```bash
npx syncdocs generate src/utils.ts
```

## Commands

### `syncdocs init`

Initialize syncdocs in your project. Creates a `_syncdocs/config.yaml` with your preferred output directory, file scope, and documentation style.

### `syncdocs generate <file> [options]`

Generate documentation for a specific file or symbol.

```bash
syncdocs generate src/utils.ts              # all symbols in file
syncdocs generate src/utils.ts:myFunction   # single symbol
syncdocs generate src/utils.ts --style beginner-friendly
syncdocs generate src/utils.ts --depth 1    # include callees one level deep
syncdocs generate src/utils.ts --depth 1 --discover  # also discover runtime dispatches
syncdocs generate src/utils.ts --force      # regenerate even if up-to-date
```

Options:
- `--style <type>` - Documentation style (`technical`, `beginner-friendly`, `comprehensive`)
- `--depth <n>` - Follow function calls across files up to N levels deep, generating docs for each callee
- `--discover` - Use AI to discover runtime connections (e.g. task dispatches, event emissions) that static analysis can't see
- `--force` - Regenerate docs even if source hasn't changed

### `syncdocs regenerate [options]`

Regenerate all existing documentation. Scans the output directory for docs, re-extracts symbols from source, and regenerates content via AI.

```bash
syncdocs regenerate
syncdocs regenerate --style comprehensive
```

Options:
- `--style <type>` - Documentation style (`technical`, `beginner-friendly`, `comprehensive`)

### `syncdocs check [--fix]`

Check for stale documentation. Compares current code hashes against stored doc hashes and reports any that are out of sync. Returns exit code 1 if stale docs are found (CI-friendly).

```bash
syncdocs check        # report stale docs
syncdocs check --fix  # auto-regenerate stale docs
```

### `syncdocs status [--verbose]`

Show documentation coverage for your project, including a suggestion for what to document next.

```bash
syncdocs status            # coverage summary
syncdocs status --verbose  # include full list of undocumented symbols
```

### `syncdocs serve [--port <number>]`

Start an interactive documentation viewer in your browser.

```bash
syncdocs serve              # default port 3456
syncdocs serve --port 8080
```

### `syncdocs validate`

Validate your `_syncdocs/config.yaml` for required fields and check that your API key is set.

## How it works

1. **Extract** - The TypeScript compiler API parses source files and extracts symbols (functions, classes, arrow functions)
2. **Hash** - Symbol content (params + body) is SHA256 hashed, ignoring names and formatting so renames don't trigger staleness
3. **Generate** - Claude generates markdown documentation with collapsible sections and mermaid flow diagrams
4. **Track** - Each doc file includes YAML frontmatter with dependency hashes linking it to source symbols
5. **Check** - Compare stored hashes against current code to detect when docs are out of sync

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
    - node_modules/**

generation:
  aiProvider: anthropic
  prompt: |
    Document for senior engineers joining the team.
    Focus on why decisions were made, not just what the code does.

git:
  includeCommitMessages: true
  commitDepth: 10
```

## Known Limitations

- **Monorepo project root detection**: `--discover` walks up to the nearest `package.json` to find the project root. In a monorepo, this finds the sub-package root, not the repo root. Task definitions in sibling packages won't be discovered.
- **Large project performance**: `--discover` scans all `.ts`/`.tsx` files in the project to verify discovered connections. On very large codebases this scan may be slow.

## Contributing

```bash
git clone https://github.com/fredrivett/syncdocs
cd syncdocs
npm install
cp .env.example .env  # add your ANTHROPIC_API_KEY
```

```bash
npm run dev          # watch mode
npm run build        # build to dist/
npm test             # run tests
npm run format       # format with biome
```
