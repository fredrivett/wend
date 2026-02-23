---
'syncdocs': patch
---

Add syncdocs jsdoc command and missing-JSDoc viewer banner

Introduces a new `syncdocs jsdoc` CLI command with `--run`, `--prompt`, and `--verbose` modes to help surface and fix missing JSDoc comments. Extracts `renderMissingJsDocList` helper for reuse across commands, updates the status outro logic to distinguish between doc and JSDoc coverage, and moves missing-JSDoc warnings from static generated markdown to the viewer UI via a new `MissingJsDocBanner` component with inline agent prompt guidance.
