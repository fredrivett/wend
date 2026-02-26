---
'wend': patch
---

Exclude gitignored files from source scanning by using `git ls-files` instead of manual directory walking. Generated code (e.g. Prisma clients) no longer appears in JSDoc coverage reports.
