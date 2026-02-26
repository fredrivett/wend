---
'wend': minor
---

Drop per-symbol markdown file generation entirely. `graph.json` is now the sole output. Markdown rendering is done on-the-fly by the server from graph data instead of from pre-written files on disk. This removes `StaticDocGenerator`, `DocParser`, and the entire `_wend/` directory, and updates the checker and CLI commands to work with graph nodes directly.
