import { marked } from 'marked';
import { useMemo } from 'react';

interface DocContentProps {
  markdown: string;
  name: string;
  sourcePath: string;
  generated?: string;
}

export function DocContent({ markdown, sourcePath, generated }: DocContentProps) {
  const html = useMemo(() => {
    return marked.parse(markdown, { async: false }) as string;
  }, [markdown]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400">
        {sourcePath}
        {generated && ` \u00b7 ${new Date(generated).toLocaleDateString()}`}
      </div>
      <div
        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-50 prose-pre:text-sm prose-td:text-sm prose-th:text-sm"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered from markdown via marked
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
