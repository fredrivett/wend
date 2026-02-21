---
title: registerStatusCommand
generated: 2026-02-21T15:16:37.165Z
graphNode: src/cli/commands/status.ts:registerStatusCommand
dependencies:
  - path: src/cli/commands/status.ts
    symbol: registerStatusCommand
    hash: 55a57a5e9170f7f668cc262713770d4cd54cb258e2ad86b2cb2c5b7bf31068b4
---

# registerStatusCommand

`exported`

`function` in `src/cli/commands/status.ts:14-107`

Register the `syncdocs status` CLI command.

Scans the project for documentation coverage and displays statistics
including a coverage bar, undocumented symbols, and a suggestion for
the next file to document.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| cli | `CAC` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `loadConfig` | `src/cli/utils/config.ts` | direct-call |
| `scanProjectAsync` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `renderCoverageStats` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `computeNextCandidate` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `renderNextSuggestion` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `getRelativePath` | `src/cli/utils/next-suggestion.ts` | conditional-call |
