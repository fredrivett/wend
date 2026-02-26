---
"wend": patch
---

Improve CLI setup and sync behavior for real-world project layouts.

`wend init` now auto-detects common source directories and suggests matching include patterns. `wend sync` now warns clearly when include patterns match zero files. YAML config parsing is more robust for commented include/exclude lists.
