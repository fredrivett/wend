---
'wend': patch
---

Add JSDoc coverage stats to CLI and docs viewer

Thread `hasJsDoc` flag through the data layer (GraphNode, ProjectScan, frontmatter, DocParser, SymbolEntry) to surface JSDoc coverage as a first-class metric. The `status` command now shows a JSDoc coverage bar, the `sync` command includes a JSDoc summary line, generated markdown shows a warning for undocumented symbols, and the docs viewer displays indicators in the sidebar tree and graph nodes.
