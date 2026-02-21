---
title: ContentHasher
generated: 2026-02-21T15:16:37.172Z
graphNode: src/hasher/index.ts:ContentHasher
dependencies:
  - path: src/hasher/index.ts
    symbol: ContentHasher
    hash: 6bf2acdd6eadbec3589bf9e03a1b6c71ab4e5a012b8b697514d242981278106f
---

# ContentHasher

`exported`

`class` in `src/hasher/index.ts:8-67`

SHA256 content hasher for detecting symbol changes. Hashes params + body (not name) so renames don't trigger staleness.

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `hashSymbol` | `src/hasher/index.ts` | direct-call |
