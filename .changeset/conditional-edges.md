---
'syncdocs': patch
---

Add conditional branching awareness to call graph edges

Detect if/else, else-if chains, switch/case, ternary, and &&/|| guards during AST extraction. Conditional calls produce `conditional-call` edges with a `conditions` array capturing the full chain of ancestor conditions. The graph viewer includes a toggle to show/hide conditional detail. Smart deduplication merges unconditional + conditional calls and collapses both-branch calls to unconditional.
