import { useCallback, useEffect, useState } from 'react';
import type { GraphNode } from '../../../graph/types.js';
import { DocContent } from './DocContent';
import { Badge, type BadgeVariant } from './ui/badge';
import {
  SheetOrDrawer,
  SheetOrDrawerBody,
  SheetOrDrawerClose,
  SheetOrDrawerContent,
  SheetOrDrawerDescription,
  SheetOrDrawerFooter,
  SheetOrDrawerHeader,
  SheetOrDrawerTitle,
} from './ui/sheet-or-drawer';

interface DocResponse {
  name: string;
  sourcePath: string;
  markdown: string;
  generated?: string;
}

interface DocPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

function nodeToDocPath(node: GraphNode): string {
  const withoutExt = node.filePath.replace(/\.[^.]+$/, '');
  return `${withoutExt}/${node.name}.md`;
}

function docPathToUrl(docPath: string): string {
  return `/docs/${docPath.replace(/^\/?src\//, '').replace(/\.md$/, '')}`;
}

export function DocPanel({ node, onClose }: DocPanelProps) {
  const [doc, setDoc] = useState<DocResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!node) {
      setDoc(null);
      return;
    }

    const docPath = nodeToDocPath(node);
    setLoading(true);
    setError(null);

    fetch(`/api/doc?path=${encodeURIComponent(docPath)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Doc not found');
        return res.json();
      })
      .then((data: DocResponse) => {
        setDoc(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [node]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  const docPath = node ? nodeToDocPath(node) : '';

  return (
    <SheetOrDrawer open={!!node} onOpenChange={handleOpenChange}>
      <SheetOrDrawerContent>
        <SheetOrDrawerHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {node && (
                <Badge
                  variant={
                    node.kind === 'component'
                      ? 'component'
                      : node.kind === 'function' && /^use[A-Z]/.test(node.name)
                        ? ('hook' as BadgeVariant)
                        : 'default'
                  }
                >
                  {node.kind === 'function' && /^use[A-Z]/.test(node.name) ? 'hook' : node.kind}
                </Badge>
              )}
              <SheetOrDrawerTitle>{node?.name ?? ''}</SheetOrDrawerTitle>
            </div>
            <div className="flex items-center gap-1">
              {doc && (
                <a
                  href={docPathToUrl(docPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Open full doc"
                >
                  <span className="sr-only">Open full doc</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              )}
              <SheetOrDrawerClose className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </SheetOrDrawerClose>
            </div>
          </div>
          <SheetOrDrawerDescription>
            {node?.filePath ?? ''}
            {node ? `:${node.lineRange[0]}-${node.lineRange[1]}` : ''}
          </SheetOrDrawerDescription>
        </SheetOrDrawerHeader>

        <SheetOrDrawerBody>
          {loading && <div className="py-8 text-center text-sm text-gray-400">Loading...</div>}
          {error && (
            <div className="py-8 text-center text-sm text-gray-400">
              No documentation found for this symbol.
              <br />
              <span className="text-xs">
                Run <code className="rounded bg-gray-100 px-1 py-0.5">syncdocs sync</code> to
                generate docs.
              </span>
            </div>
          )}
          {doc && (
            <DocContent
              markdown={doc.markdown}
              name={doc.name}
              sourcePath={doc.sourcePath}
              generated={doc.generated}
            />
          )}
        </SheetOrDrawerBody>

        {doc && (
          <SheetOrDrawerFooter>
            <a
              href={docPathToUrl(docPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
              Open full documentation
            </a>
          </SheetOrDrawerFooter>
        )}
      </SheetOrDrawerContent>
    </SheetOrDrawer>
  );
}
