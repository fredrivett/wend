---
"syncdocs": minor
---

Add AI-powered runtime connection discovery (--discover) and cross-file depth traversal (--depth)

New --discover flag uses AI to find runtime dispatch connections (e.g. tasks.trigger("task-id")) that static analysis can't see, verifies them against the codebase, and includes them in generated docs with mermaid diagrams. New --depth flag follows function calls across files and generates docs for each callee. Also makes isDocUpToDate check all dependency hashes so docs are correctly flagged stale when any dependency changes.
