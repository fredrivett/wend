/**
 * Static documentation generator — produces markdown from graph + extractor data.
 * No AI involved. All content comes from static analysis.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { FlowGraph, GraphEdge, GraphNode } from '../graph/types.js';

export interface StaticDocResult {
  filePath: string;
  symbolName: string;
  success: boolean;
  error?: string;
}

export class StaticDocGenerator {
  private outputDir: string;

  /** @param outputDir - Root directory where generated markdown files are written */
  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Generate a static markdown doc for a graph node.
   * Writes the file to disk and returns the result.
   */
  generateForNode(node: GraphNode, graph: FlowGraph): StaticDocResult {
    const docPath = this.getDocPath(node);

    try {
      const content = this.renderMarkdown(node, graph);

      const dir = dirname(docPath);
      mkdirSync(dir, { recursive: true });
      writeFileSync(docPath, content, 'utf-8');

      return { filePath: docPath, symbolName: node.name, success: true };
    } catch (error) {
      return {
        filePath: docPath,
        symbolName: node.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Compute the output path for a node's doc file.
   * Mirrors the source directory structure under the output dir.
   */
  private getDocPath(node: GraphNode): string {
    // node.filePath is already relative (e.g. "src/checker/index.ts")
    const withoutExt = node.filePath.replace(/\.[^.]+$/, '');
    return join(this.outputDir, `${withoutExt}/${node.name}.md`);
  }

  /**
   * Render the full markdown document for a node.
   */
  private renderMarkdown(node: GraphNode, graph: FlowGraph): string {
    const lines: string[] = [];

    // Frontmatter
    lines.push('---');
    lines.push(`title: ${node.name}`);
    lines.push(`generated: ${new Date().toISOString()}`);
    lines.push(`graphNode: ${node.id}`);
    lines.push('dependencies:');
    lines.push(`  - path: ${node.filePath}`);
    lines.push(`    symbol: ${node.name}`);
    lines.push(`    hash: ${node.hash}`);
    lines.push('---');
    lines.push('');

    // Title
    lines.push(`# ${node.name}`);
    lines.push('');

    // Export badge
    if (node.isExported) {
      lines.push('`exported`');
      lines.push('');
    }

    // Deprecated notice
    if (node.deprecated) {
      const reason = typeof node.deprecated === 'string' ? `: ${node.deprecated}` : '';
      lines.push(`> **Deprecated**${reason}`);
      lines.push('');
    }

    // Kind + location
    const lineRange = `${node.lineRange[0]}-${node.lineRange[1]}`;
    lines.push(`\`${node.kind}\` in \`${node.filePath}:${lineRange}\``);
    lines.push('');

    // Description
    if (node.description) {
      lines.push(node.description);
      lines.push('');
    }

    // Entry point info
    if (node.entryType) {
      lines.push(this.renderEntryPointInfo(node));
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
        const type = `\`${param.type}\``;
        const required = param.isOptional ? 'No' : 'Yes';
        const defaultNote = param.defaultValue ? ` (default: \`${param.defaultValue}\`)` : '';
        const desc = (param.description ?? '') + defaultNote;
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
      lines.push(this.renderEdgeTable(outgoing, graph, 'target'));
      lines.push('');
    }

    // Called by (incoming edges)
    const incoming = graph.edges.filter((e) => e.target === node.id);
    if (incoming.length > 0) {
      lines.push('**Called by:**');
      lines.push('');
      lines.push(this.renderEdgeTable(incoming, graph, 'source'));
      lines.push('');
    }

    // Async indicator
    if (node.isAsync) {
      lines.push('*This symbol is async.*');
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
   * Render entry point metadata (API route, event trigger, etc.)
   */
  private renderEntryPointInfo(node: GraphNode): string {
    const parts: string[] = [];
    parts.push(`**Entry point:** \`${node.entryType}\``);

    if (node.metadata) {
      if (node.metadata.httpMethod) {
        parts.push(
          `**HTTP:** \`${node.metadata.httpMethod}${node.metadata.route ? ` ${node.metadata.route}` : ''}\``,
        );
      }
      if (node.metadata.eventTrigger) {
        parts.push(`**Event:** \`${node.metadata.eventTrigger}\``);
      }
      if (node.metadata.taskId) {
        parts.push(`**Task:** \`${node.metadata.taskId}\``);
      }
      if (node.metadata.route && !node.metadata.httpMethod) {
        parts.push(`**Route:** \`${node.metadata.route}\``);
      }
    }

    return parts.join('  \n');
  }

  /**
   * Render a table of edges showing connected nodes.
   */
  private renderEdgeTable(
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
}
