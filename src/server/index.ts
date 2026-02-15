import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, relative, resolve } from 'node:path';
import { DocParser } from '../checker/doc-parser.js';
import { findMarkdownFiles } from '../cli/utils/next-suggestion.js';
import { getTemplate } from './template.js';

export interface SymbolEntry {
  name: string;
  docPath: string; // relative to outputDir, e.g. "src/generator/index/generator.md"
  sourcePath: string;
  overview: string;
  related: string[]; // symbol names extracted from Related section
  syncdocsVersion?: string;
  generated?: string;
}

export interface SymbolIndex {
  entries: Map<string, SymbolEntry>; // keyed by docPath
  byName: Map<string, SymbolEntry[]>; // symbol name -> entries (handles duplicates)
}

function buildSymbolIndex(outputDir: string): SymbolIndex {
  const absOutputDir = resolve(process.cwd(), outputDir);
  const mdFiles = findMarkdownFiles(absOutputDir);
  const parser = new DocParser();

  const entries = new Map<string, SymbolEntry>();
  const byName = new Map<string, SymbolEntry[]>();

  for (const filePath of mdFiles) {
    try {
      const metadata = parser.parseDocFile(filePath);
      const content = readFileSync(filePath, 'utf-8');
      const docPath = relative(absOutputDir, filePath);

      const overview = extractOverview(content);
      const related = extractRelatedSymbols(content, metadata.title);
      const sourcePath = metadata.dependencies[0]?.path ?? '';

      const entry: SymbolEntry = {
        name: metadata.title,
        docPath,
        sourcePath,
        overview,
        related,
        syncdocsVersion: metadata.syncdocsVersion,
        generated: metadata.generated,
      };

      entries.set(docPath, entry);

      const existing = byName.get(metadata.title) ?? [];
      existing.push(entry);
      byName.set(metadata.title, existing);
    } catch {
      // Skip invalid doc files
    }
  }

  return { entries, byName };
}

export function extractOverview(content: string): string {
  // Get text between frontmatter end and first <details> or ## heading
  const afterFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
  const afterTitle = afterFrontmatter.replace(/^#\s+.*\n+/, '');
  const overviewEnd = afterTitle.search(/(<details>|^##\s)/m);
  const overview = overviewEnd >= 0 ? afterTitle.substring(0, overviewEnd) : afterTitle;
  return overview.trim();
}

export function extractRelatedSymbols(content: string, selfName: string): string[] {
  // Find the Related section
  const relatedMatch = content.match(
    /<details>\s*<summary>Related<\/summary>([\s\S]*?)<\/details>/,
  );
  if (!relatedMatch) return [];

  const relatedContent = relatedMatch[1];
  const seen = new Set<string>();
  const symbols: string[] = [];

  const addSymbol = (name: string) => {
    if (name !== selfName && !seen.has(name)) {
      seen.add(name);
      symbols.push(name);
    }
  };

  // Match backtick-wrapped names: `SymbolName`
  for (const match of relatedContent.matchAll(/`([A-Z][A-Za-z0-9]+(?:\(\))?)`/g)) {
    addSymbol(match[1].replace(/\(\)$/, ''));
  }

  // Match bold names: **SymbolName**
  for (const match of relatedContent.matchAll(/\*\*([A-Z][A-Za-z0-9]+(?:\s+\w+)?)\*\*/g)) {
    addSymbol(match[1].split(/\s/)[0]);
  }

  return symbols;
}

export function generateDependencyGraph(entry: SymbolEntry, index: SymbolIndex): string | null {
  const linkedRelated = entry.related.filter((name) => {
    const targets = index.byName.get(name);
    return targets && targets.length > 0;
  });

  if (linkedRelated.length === 0) return null;

  const lines = ['flowchart LR'];
  const safeId = (name: string) => name.replace(/[^A-Za-z0-9]/g, '_');
  const currentId = safeId(entry.name);

  lines.push(`    ${currentId}[${entry.name}]:::current`);

  for (const name of linkedRelated) {
    const targets = index.byName.get(name);
    if (!targets) continue;
    const target = targets[0];
    const targetId = safeId(name);
    lines.push(`    ${targetId}[${name}]`);
    lines.push(`    ${currentId} --> ${targetId}`);
    lines.push(`    click ${targetId} href "#/doc/${encodeURIComponent(target.docPath)}"`);
  }

  return lines.join('\n');
}

function buildIndexResponse(index: SymbolIndex) {
  // Group entries by source directory
  const tree: Record<string, { name: string; docPath: string; overview: string }[]> = {};

  for (const [, entry] of index.entries) {
    const dir = dirname(entry.sourcePath) || '.';
    if (!tree[dir]) tree[dir] = [];
    tree[dir].push({
      name: entry.name,
      docPath: entry.docPath,
      overview: entry.overview,
    });
  }

  // Sort directories and entries within
  const sorted: Record<string, (typeof tree)[string]> = {};
  for (const dir of Object.keys(tree).sort()) {
    sorted[dir] = tree[dir].sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

function buildDocResponse(docPath: string, index: SymbolIndex, outputDir: string) {
  const entry = index.entries.get(docPath);
  if (!entry) return null;

  const absPath = resolve(process.cwd(), outputDir, docPath);
  let content: string;
  try {
    content = readFileSync(absPath, 'utf-8');
  } catch {
    return null;
  }

  // Strip frontmatter for display
  const markdown = content.replace(/^---[\s\S]*?---\s*/, '');

  const dependencyGraph = generateDependencyGraph(entry, index);

  return {
    name: entry.name,
    sourcePath: entry.sourcePath,
    syncdocsVersion: entry.syncdocsVersion,
    generated: entry.generated,
    markdown,
    dependencyGraph,
    related: entry.related
      .map((name) => {
        const targets = index.byName.get(name);
        if (!targets || targets.length === 0) return { name, docPath: null };
        return { name, docPath: targets[0].docPath };
      })
      .filter((r) => r.docPath),
  };
}

export async function startServer(outputDir: string, port: number) {
  const index = buildSymbolIndex(outputDir);
  const template = getTemplate();

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(template);
      return;
    }

    if (url.pathname === '/api/index') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(buildIndexResponse(index)));
      return;
    }

    if (url.pathname === '/api/doc') {
      const docPath = url.searchParams.get('path');
      if (!docPath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing path parameter' }));
        return;
      }

      const doc = buildDocResponse(decodeURIComponent(docPath), index, outputDir);
      if (!doc) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Document not found' }));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(doc));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  return new Promise<{ server: typeof server; url: string }>((resolve) => {
    server.listen(port, () => {
      resolve({ server, url: `http://localhost:${port}` });
    });
  });
}
