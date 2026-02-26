import { existsSync, readFileSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMermaidSVG } from 'beautiful-mermaid';
import { getDocPath, renderNodeMarkdown } from '../graph/graph-renderer.js';
import { GraphStore } from '../graph/graph-store.js';
import { nodeToMermaid } from '../graph/graph-to-mermaid.js';
import type { FlowGraph } from '../graph/types.js';

export interface SymbolEntry {
  name: string;
  docPath: string; // virtual path, e.g. "src/generator/index/generator.md"
  sourcePath: string;
  overview: string;
  related: string[]; // symbol names derived from graph edges
  nodeId: string; // graph node ID for lookups
  generated?: string;
  // Badge / symbol metadata from graph node
  kind?: string;
  exported?: boolean;
  isAsync?: boolean;
  hasJsDoc?: boolean;
  isTrivial?: boolean;
  deprecated?: string | boolean;
  lineRange?: string;
  entryType?: string;
  httpMethod?: string;
  route?: string;
  eventTrigger?: string;
  taskId?: string;
}

export interface SymbolIndex {
  entries: Map<string, SymbolEntry>; // keyed by docPath
  byName: Map<string, SymbolEntry[]>; // symbol name -> entries (handles duplicates)
}

/**
 * Build a lookup index of all symbols from graph data.
 *
 * Iterates graph nodes, derives doc paths, and builds two maps: one keyed
 * by doc path, one keyed by symbol name (for cross-referencing).
 *
 * @param graph - The flow graph to index
 */
function buildSymbolIndexFromGraph(graph: FlowGraph): SymbolIndex {
  const entries = new Map<string, SymbolEntry>();
  const byName = new Map<string, SymbolEntry[]>();

  // Pre-build a node lookup map for edge resolution
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Build a set of connected node names per node for the `related` field
  const relatedByNodeId = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    if (!relatedByNodeId.has(edge.source)) relatedByNodeId.set(edge.source, new Set());
    if (!relatedByNodeId.has(edge.target)) relatedByNodeId.set(edge.target, new Set());

    relatedByNodeId.get(edge.source)!.add(targetNode.name);
    relatedByNodeId.get(edge.target)!.add(sourceNode.name);
  }

  for (const node of graph.nodes) {
    const docPath = getDocPath(node);
    const related = [...(relatedByNodeId.get(node.id) ?? [])];

    const entry: SymbolEntry = {
      name: node.name,
      docPath,
      sourcePath: node.filePath,
      overview: node.description ?? '',
      related,
      nodeId: node.id,
      generated: graph.generatedAt,
      kind: node.kind,
      exported: node.isExported,
      isAsync: node.isAsync,
      hasJsDoc: node.hasJsDoc,
      isTrivial: node.isTrivial,
      deprecated: node.deprecated,
      lineRange: node.lineRange ? `${node.lineRange[0]}-${node.lineRange[1]}` : undefined,
      entryType: node.entryType,
      httpMethod: node.metadata?.httpMethod,
      route: node.metadata?.route,
      eventTrigger: node.metadata?.eventTrigger,
      taskId: node.metadata?.taskId,
    };

    entries.set(docPath, entry);

    const existing = byName.get(node.name) ?? [];
    existing.push(entry);
    byName.set(node.name, existing);
  }

  return { entries, byName };
}

/**
 * Build the JSON response for the `/api/index` endpoint.
 *
 * Groups symbol entries by source directory and sorts both directories
 * and entries alphabetically for the sidebar tree.
 */
function buildIndexResponse(index: SymbolIndex) {
  // Group entries by source directory
  const tree: Record<
    string,
    {
      name: string;
      docPath: string;
      overview: string;
      hasJsDoc?: boolean;
      isTrivial?: boolean;
    }[]
  > = {};

  for (const [, entry] of index.entries) {
    const dir = dirname(entry.sourcePath) || '.';
    if (!tree[dir]) tree[dir] = [];
    tree[dir].push({
      name: entry.name,
      docPath: entry.docPath,
      overview: entry.overview,
      hasJsDoc: entry.hasJsDoc,
      isTrivial: entry.isTrivial,
    });
  }

  // Sort directories and entries within
  const sorted: Record<string, (typeof tree)[string]> = {};
  for (const dir of Object.keys(tree).sort()) {
    sorted[dir] = tree[dir].sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

/**
 * Build the JSON response for the `/api/doc` endpoint.
 *
 * Generates markdown on-the-fly from graph data and enriches the response
 * with metadata from the symbol index and a dependency graph.
 *
 * @param docPath - Virtual doc path (e.g. "src/checker/index/StaleChecker.md")
 * @param index - The symbol index for metadata enrichment
 * @param graph - The flow graph for rendering and mermaid generation
 * @returns Enriched doc response, or null if the doc path is not in the index
 */
function buildDocResponse(docPath: string, index: SymbolIndex, graph: FlowGraph) {
  const entry = index.entries.get(docPath);
  if (!entry) return null;

  const node = graph.nodes.find((n) => n.id === entry.nodeId);
  if (!node) return null;

  const markdown = renderNodeMarkdown(node, graph);
  const mermaidSource = nodeToMermaid(graph, node.id);
  let dependencyGraph: string | null = null;
  if (mermaidSource) {
    try {
      dependencyGraph = renderMermaidSVG(mermaidSource, { bg: '#ffffff', fg: '#1e293b' });
    } catch {
      // Fall back to raw mermaid string if rendering fails
      dependencyGraph = mermaidSource;
    }
  }

  return {
    name: entry.name,
    sourcePath: entry.sourcePath,
    generated: entry.generated,
    kind: entry.kind,
    exported: entry.exported,
    isAsync: entry.isAsync,
    hasJsDoc: entry.hasJsDoc,
    isTrivial: entry.isTrivial,
    deprecated: entry.deprecated,
    lineRange: entry.lineRange,
    entryType: entry.entryType,
    httpMethod: entry.httpMethod,
    route: entry.route,
    eventTrigger: entry.eventTrigger,
    taskId: entry.taskId,
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

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

/**
 * Serve a static file with the appropriate Content-Type header.
 *
 * @param filePath - Absolute path to the file
 * @param res - HTTP response object
 * @returns `true` if the file was served, `false` if it doesn't exist
 */
function serveStaticFile(filePath: string, res: import('node:http').ServerResponse): boolean {
  if (!existsSync(filePath)) return false;
  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
  return true;
}

/**
 * Start the syncdocs documentation viewer HTTP server.
 *
 * Serves the single-page viewer app, a JSON API for the symbol index and
 * individual doc pages, and the graph data. Watches graph.json for changes
 * and rebuilds the index automatically.
 *
 * If the requested port is taken, retries up to 10 consecutive ports.
 *
 * @param outputDir - Path to the syncdocs output directory (e.g. `_syncdocs`)
 * @param port - Preferred port number to listen on
 * @returns The running server instance and the URL it's listening on
 * @throws If no available port is found after 10 attempts
 */
export async function startServer(outputDir: string, port: number) {
  const graphStore = new GraphStore(outputDir);
  let graph = graphStore.read();
  let index: SymbolIndex = graph
    ? buildSymbolIndexFromGraph(graph)
    : { entries: new Map(), byName: new Map() };

  // Watch output directory for graph.json changes and rebuild index
  const absOutputDir = resolve(process.cwd(), outputDir);
  let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
  try {
    watch(absOutputDir, { recursive: true }, (_event, filename) => {
      if (filename !== 'graph.json') return;
      if (rebuildTimer) clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => {
        graph = graphStore.read();
        if (graph) {
          index = buildSymbolIndexFromGraph(graph);
        }
      }, 500);
    });
  } catch {
    // Directory may not exist yet
  }

  // Resolve viewer-dist directory (relative to this file's location in dist/)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const viewerDistDir = resolve(__dirname, 'viewer-dist');

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    // Serve graph API
    if (url.pathname === '/api/graph') {
      if (!graph) {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'Graph not found. Run: syncdocs sync' }));
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(graph));
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

      if (!graph) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Graph not found. Run: syncdocs sync' }));
        return;
      }

      const doc = buildDocResponse(decodeURIComponent(docPath), index, graph);
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

    // Serve viewer assets (JS, CSS, etc.)
    if (url.pathname.startsWith('/assets/')) {
      const assetPath = resolve(viewerDistDir, url.pathname.slice(1));
      if (serveStaticFile(assetPath, res)) return;
    }

    // Serve viewer (SPA fallback) at root
    const indexPath = resolve(viewerDistDir, 'index.html');
    if (serveStaticFile(indexPath, res)) return;

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const tryPort = port + attempt;
    try {
      const result = await new Promise<{
        server: typeof server;
        url: string;
        graph: FlowGraph | null;
      }>((resolve, reject) => {
        server.once('error', reject);
        server.listen(tryPort, () => {
          server.removeListener('error', reject);
          resolve({ server, url: `http://localhost:${tryPort}`, graph });
        });
      });
      return result;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
        continue;
      }
      throw err;
    }
  }
  throw new Error(`No available port found (tried ${port}-${port + maxRetries - 1})`);
}
