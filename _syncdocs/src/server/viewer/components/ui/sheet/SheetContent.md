---
title: SheetContent
generated: 2026-02-21T15:16:37.179Z
graphNode: src/server/viewer/components/ui/sheet.tsx:SheetContent
dependencies:
  - path: src/server/viewer/components/ui/sheet.tsx
    symbol: SheetContent
    hash: e5773d15adbd72bfaf697a9fe1dd42710416d568b3a79a0dc98f34ac4b405a7d
---

# SheetContent

`component` in `src/server/viewer/components/ui/sheet.tsx:36-84`

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| {
  className,
  children,
  side = 'right',
  overlay = false,
  showCloseButton = false,
  ...props
} | `React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  overlay?: boolean;
  showCloseButton?: boolean;
}` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `cn` | `src/server/viewer/lib/utils.ts` | direct-call |
