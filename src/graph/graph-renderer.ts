/**
 * Render markdown documentation from graph nodes — no file I/O, no frontmatter.
 *
 * Extracted from StaticDocGenerator for use by the server (on-the-fly rendering)
 * and any future consumers that need markdown from graph data.
 */

import type { FlowGraph, GraphEdge, GraphNode } from './types.js';

/**
 * Render the markdown body for a graph node (no frontmatter).
 *
 * Produces: title, description, parameters table, return type,
 * calls/called-by tables, examples, throws, and see-also sections.
 *
 * @param node - The graph node to render
 * @param graph - The full flow graph (needed for edge lookups)
 * @returns Markdown string
 */
export function renderNodeMarkdown(node: GraphNode, graph: FlowGraph): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${node.name}`);
  lines.push('');

  // Description
  if (node.description) {
    lines.push(node.description);
    lines.push('');
  }

  // Parameters table
  if (node.structuredParams && node.structuredParams.length > 0) {
    lines.push('**Parameters:**');
    lines.push('');
    lines.push('| Name | Type | Required | Description |');
    lines.push('|---|---|---|---|');
    for (const param of node.structuredParams) {
      const name = param.isRest ? `...${param.name}` : param.name;
      const type = `\`${param.type.replace(/\|/g, '\\|')}\``;
      const required = param.isOptional ? 'No' : 'Yes';
      const defaultNote = param.defaultValue
        ? ` (default: \`${param.defaultValue.replace(/\|/g, '\\|')}\`)`
        : '';
      const desc = ((param.description ?? '') + defaultNote).replace(/\|/g, '\\|');
      lines.push(`| ${name} | ${type} | ${required} | ${desc} |`);
    }
    lines.push('');
  }

  // Return type
  if (node.returnType) {
    lines.push(`**Returns:** \`${node.returnType}\``);
    lines.push('');
  }

  // Calls (outgoing edges)
  const outgoing = graph.edges.filter((e) => e.source === node.id);
  if (outgoing.length > 0) {
    lines.push('**Calls:**');
    lines.push('');
    lines.push(renderEdgeTable(outgoing, graph, 'target'));
    lines.push('');
  }

  // Called by (incoming edges)
  const incoming = graph.edges.filter((e) => e.target === node.id);
  if (incoming.length > 0) {
    lines.push('**Called by:**');
    lines.push('');
    lines.push(renderEdgeTable(incoming, graph, 'source'));
    lines.push('');
  }

  // Examples
  if (node.examples && node.examples.length > 0) {
    lines.push('**Examples:**');
    lines.push('');
    for (const example of node.examples) {
      lines.push('```typescript');
      lines.push(example.trim());
      lines.push('```');
      lines.push('');
    }
  }

  // Throws
  if (node.throws && node.throws.length > 0) {
    lines.push('**Throws:**');
    lines.push('');
    for (const t of node.throws) {
      lines.push(`- ${t}`);
    }
    lines.push('');
  }

  // See also
  if (node.see && node.see.length > 0) {
    lines.push('**See also:**');
    lines.push('');
    for (const s of node.see) {
      lines.push(`- ${s}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Render a table of edges showing connected nodes.
 *
 * @param edges - The edges to render
 * @param graph - The full graph (for node name lookups)
 * @param direction - Which end of the edge to show ('source' or 'target')
 */
function renderEdgeTable(
  edges: GraphEdge[],
  graph: FlowGraph,
  direction: 'source' | 'target',
): string {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const lines: string[] = [];

  lines.push('| Symbol | File | Type |');
  lines.push('|---|---|---|');

  for (const edge of edges) {
    const nodeId = direction === 'target' ? edge.target : edge.source;
    const connectedNode = nodeMap.get(nodeId);
    const name = connectedNode?.name ?? nodeId.split(':').pop() ?? nodeId;
    const file = connectedNode?.filePath ?? '';
    const edgeType = edge.type;

    lines.push(`| \`${name}\` | \`${file}\` | ${edgeType} |`);
  }

  return lines.join('\n');
}

/**
 * Compute the virtual doc path for a graph node.
 *
 * Mirrors the directory structure of the source file under the output dir.
 * Example: node with filePath "src/checker/index.ts" and name "StaleChecker"
 * produces "src/checker/index/StaleChecker.md".
 *
 * @param node - The graph node
 * @returns Relative doc path (no leading slash)
 */
export function getDocPath(node: GraphNode): string {
  const withoutExt = node.filePath.replace(/\.[^.]+$/, '');
  return `${withoutExt}/${node.name}.md`;
}
