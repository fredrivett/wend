---
title: GraphBuilder
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-builder.ts:GraphBuilder
dependencies:
  - path: src/graph/graph-builder.ts
    symbol: GraphBuilder
    hash: fe22d951761c621c1745a57b7f120b4b3e8d4d449917431e967583d01b1ae541
---

# GraphBuilder

`exported`

`class` in `src/graph/graph-builder.ts:56-349`

/** Builds a {@link FlowGraph}from TypeScript source files by extracting symbols, detecting entry points, and resolving call edges. 

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `getRelativePath` | `src/graph/graph-builder.ts` | direct-call |
| `isAsyncSymbol` | `src/graph/graph-builder.ts` | direct-call |
| `resolveImportPath` | `src/extractor/resolve-import.ts` | direct-call |
| `connectionTypeToEdgeType` | `src/graph/graph-builder.ts` | conditional-call |
