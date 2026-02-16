# syncdocs

## 0.1.1

### Patch Changes

- 02f1ece: Fix release workflow build failing by separating build and publish steps

## 0.1.0

### Minor Changes

- 924d444: Add AI-powered runtime connection discovery (--discover) and cross-file depth traversal (--depth)

  New --discover flag uses AI to find runtime dispatch connections (e.g. tasks.trigger("task-id")) that static analysis can't see, verifies them against the codebase, and includes them in generated docs with mermaid diagrams. New --depth flag follows function calls across files and generates docs for each callee. Also makes isDocUpToDate check all dependency hashes so docs are correctly flagged stale when any dependency changes.

### Patch Changes

- 0259776: Add changeset infrastructure and version tracking in generated docs
- 441ae47: Enable automatic npm publishing when changesets release PR is merged
- 8c5087d: Fix status command spinner by using async file I/O and yielding during symbol extraction so the loading animation stays smooth
- 9f86a7f: Fix symbol overcounting by excluding dot-directories and common build output directories from source file discovery
- 87f178b: Auto-expand Visual Flow section in serve viewer and show syncdocs version and generated timestamp in doc metadata
