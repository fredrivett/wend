/**
 * Deterministic mermaid diagram generation from graph data
 *
 * Replaces AI-generated mermaid with accurate, graph-derived diagrams.
 */

import type { FlowGraph, GraphEdge, GraphNode } from './types.js';

/**
 * Generate a mermaid flowchart for a specific node and its immediate connections.
 * Used in per-symbol documentation.
 */
export function nodeToMermaid(graph: FlowGraph, nodeId: string, depth = 1): string {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const rootNode = nodeMap.get(nodeId);
  if (!rootNode) return '';

  // Collect nodes within the specified depth
  const included = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);

  for (let d = 0; d < depth; d++) {
    const nextFrontier = new Set<string>();
    for (const id of frontier) {
      // Outgoing edges
      for (const edge of graph.edges) {
        if (edge.source === id && !included.has(edge.target)) {
          included.add(edge.target);
          nextFrontier.add(edge.target);
        }
      }
      // Incoming edges (callers)
      for (const edge of graph.edges) {
        if (edge.target === id && !included.has(edge.source)) {
          included.add(edge.source);
          nextFrontier.add(edge.source);
        }
      }
    }
    frontier = nextFrontier;
  }

  const relevantEdges = graph.edges.filter((e) => included.has(e.source) && included.has(e.target));

  return buildMermaid(nodeId, included, relevantEdges, nodeMap);
}

/**
 * Generate a mermaid flowchart for an entire flow (from an entry point).
 * Shows all nodes reachable from the entry point.
 */
export function flowToMermaid(
  nodes: GraphNode[],
  edges: GraphEdge[],
  entryNodeId?: string,
): string {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const included = new Set(nodes.map((n) => n.id));
  return buildMermaid(entryNodeId || '', included, edges, nodeMap);
}

function buildMermaid(
  highlightId: string,
  includedIds: Set<string>,
  edges: GraphEdge[],
  nodeMap: Map<string, GraphNode>,
): string {
  const lines: string[] = ['flowchart TD'];

  // Group nodes by file for subgraphs
  const fileGroups = new Map<string, GraphNode[]>();
  for (const id of includedIds) {
    const node = nodeMap.get(id);
    if (!node) continue;
    const group = fileGroups.get(node.filePath) || [];
    group.push(node);
    fileGroups.set(node.filePath, group);
  }

  // Generate node definitions grouped by file
  for (const [filePath, nodes] of fileGroups) {
    if (fileGroups.size > 1) {
      lines.push(`  subgraph ${sanitizeId(filePath)}["${filePath}"]`);
    }

    for (const node of nodes) {
      const nodeId = sanitizeId(node.id);
      const label = formatNodeLabel(node);
      const shape = node.entryType ? `([${label}])` : `["${label}"]`;
      const indent = fileGroups.size > 1 ? '    ' : '  ';
      lines.push(`${indent}${nodeId}${shape}`);
    }

    if (fileGroups.size > 1) {
      lines.push('  end');
    }
  }

  // Generate edges
  for (const edge of edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const arrow = edgeArrow(edge);
    const label = edge.label ? `|"${sanitizeLabel(edge.label)}"|` : '';
    lines.push(`  ${sourceId} ${arrow}${label} ${targetId}`);
  }

  // Style the highlighted node
  if (highlightId && includedIds.has(highlightId)) {
    const nodeId = sanitizeId(highlightId);
    lines.push(`  style ${nodeId} fill:#dbeafe,stroke:#3b82f6,stroke-width:2px`);
  }

  // Style entry point nodes
  for (const id of includedIds) {
    const node = nodeMap.get(id);
    if (node?.entryType && id !== highlightId) {
      const nodeId = sanitizeId(id);
      lines.push(`  style ${nodeId} fill:#e0e7ff,stroke:#6366f1,stroke-width:2px`);
    }
  }

  return lines.join('\n');
}

function formatNodeLabel(node: GraphNode): string {
  let label = node.name;
  if (node.isAsync) label = `async ${label}`;
  if (node.metadata?.httpMethod) {
    label = `${node.metadata.httpMethod} ${label}`;
  }
  if (node.metadata?.eventTrigger) {
    label = `${label}\\n${node.metadata.eventTrigger}`;
  }
  if (node.metadata?.taskId) {
    label = `${label}\\n${node.metadata.taskId}`;
  }
  return label;
}

function edgeArrow(edge: GraphEdge): string {
  if (edge.type === 'error-handler') return '-. error .->';
  if (edge.type === 'event-emit' || edge.type === 'async-dispatch') return '-.->';
  if (edge.type === 'http-request') return '-- HTTP -->';
  if (edge.type === 'conditional-call') return '-.->';
  return '-->';
}

/**
 * Sanitize a label for mermaid (escape characters that break parsing)
 */
function sanitizeLabel(label: string): string {
  return label.replace(/[>"<|]/g, (ch) => `#${ch.charCodeAt(0)};`);
}

/**
 * Sanitize a node ID for mermaid (replace special characters)
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}
