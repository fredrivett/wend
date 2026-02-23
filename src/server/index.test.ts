/**
 * Tests for graph-based server index and doc building.
 *
 * The server's internal functions (buildSymbolIndexFromGraph, buildDocResponse,
 * buildIndexResponse) are not exported. These tests verify the graph renderer
 * and doc path computation that the server depends on.
 */

import { describe, expect, it } from 'vitest';
import { getDocPath, renderNodeMarkdown } from '../graph/graph-renderer.js';
import type { FlowGraph, GraphNode } from '../graph/types.js';

function makeNode(overrides: Partial<GraphNode> & { id: string; name: string }): GraphNode {
  return {
    kind: 'function',
    filePath: 'src/test.ts',
    isAsync: false,
    hash: 'abc123',
    lineRange: [1, 5] as [number, number],
    ...overrides,
  };
}

function makeGraph(nodes: GraphNode[], edges: FlowGraph['edges'] = []): FlowGraph {
  return {
    version: '1.0',
    generatedAt: '2026-02-23T00:00:00Z',
    nodes,
    edges,
  };
}

describe('getDocPath', () => {
  it('computes doc path from node filePath and name', () => {
    const node = makeNode({
      id: 'src/checker/index.ts:StaleChecker',
      name: 'StaleChecker',
      filePath: 'src/checker/index.ts',
    });
    expect(getDocPath(node)).toBe('src/checker/index/StaleChecker.md');
  });

  it('handles nested paths', () => {
    const node = makeNode({
      id: 'src/cli/commands/sync.ts:registerSyncCommand',
      name: 'registerSyncCommand',
      filePath: 'src/cli/commands/sync.ts',
    });
    expect(getDocPath(node)).toBe('src/cli/commands/sync/registerSyncCommand.md');
  });

  it('handles .tsx extensions', () => {
    const node = makeNode({ id: 'src/app.tsx:App', name: 'App', filePath: 'src/app.tsx' });
    expect(getDocPath(node)).toBe('src/app/App.md');
  });
});

describe('renderNodeMarkdown', () => {
  it('renders title and description', () => {
    const node = makeNode({
      id: 'src/test.ts:myFunc',
      name: 'myFunc',
      description: 'A test function.',
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('# myFunc');
    expect(md).toContain('A test function.');
  });

  it('renders parameters table', () => {
    const node = makeNode({
      id: 'src/test.ts:add',
      name: 'add',
      structuredParams: [
        { name: 'a', type: 'number', isOptional: false, isRest: false },
        { name: 'b', type: 'number', isOptional: true, isRest: false, defaultValue: '0' },
      ],
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('**Parameters:**');
    expect(md).toContain('| a | `number` | Yes |');
    expect(md).toContain('| b | `number` | No |');
    expect(md).toContain('(default: `0`)');
  });

  it('renders rest parameters', () => {
    const node = makeNode({
      id: 'src/test.ts:concat',
      name: 'concat',
      structuredParams: [{ name: 'items', type: 'string[]', isOptional: false, isRest: true }],
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('| ...items |');
  });

  it('renders return type', () => {
    const node = makeNode({ id: 'src/test.ts:getNum', name: 'getNum', returnType: 'number' });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('**Returns:** `number`');
  });

  it('renders calls table from outgoing edges', () => {
    const caller = makeNode({ id: 'src/a.ts:caller', name: 'caller', filePath: 'src/a.ts' });
    const callee = makeNode({ id: 'src/b.ts:callee', name: 'callee', filePath: 'src/b.ts' });
    const graph = makeGraph(
      [caller, callee],
      [{ id: 'e1', source: 'src/a.ts:caller', target: 'src/b.ts:callee', type: 'direct-call' }],
    );
    const md = renderNodeMarkdown(caller, graph);

    expect(md).toContain('**Calls:**');
    expect(md).toContain('| `callee` | `src/b.ts` | direct-call |');
  });

  it('renders called-by table from incoming edges', () => {
    const caller = makeNode({ id: 'src/a.ts:caller', name: 'caller', filePath: 'src/a.ts' });
    const callee = makeNode({ id: 'src/b.ts:callee', name: 'callee', filePath: 'src/b.ts' });
    const graph = makeGraph(
      [caller, callee],
      [{ id: 'e1', source: 'src/a.ts:caller', target: 'src/b.ts:callee', type: 'direct-call' }],
    );
    const md = renderNodeMarkdown(callee, graph);

    expect(md).toContain('**Called by:**');
    expect(md).toContain('| `caller` | `src/a.ts` | direct-call |');
  });

  it('renders examples', () => {
    const node = makeNode({
      id: 'src/test.ts:greet',
      name: 'greet',
      examples: ['greet("world")'],
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('**Examples:**');
    expect(md).toContain('```typescript');
    expect(md).toContain('greet("world")');
  });

  it('renders throws', () => {
    const node = makeNode({
      id: 'src/test.ts:parse',
      name: 'parse',
      throws: ['SyntaxError if input is invalid'],
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('**Throws:**');
    expect(md).toContain('- SyntaxError if input is invalid');
  });

  it('renders see-also', () => {
    const node = makeNode({
      id: 'src/test.ts:parse',
      name: 'parse',
      see: ['stringify'],
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('**See also:**');
    expect(md).toContain('- stringify');
  });

  it('omits sections when data is absent', () => {
    const node = makeNode({ id: 'src/test.ts:simple', name: 'simple' });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('# simple');
    expect(md).not.toContain('**Parameters:**');
    expect(md).not.toContain('**Returns:**');
    expect(md).not.toContain('**Calls:**');
    expect(md).not.toContain('**Called by:**');
    expect(md).not.toContain('**Examples:**');
    expect(md).not.toContain('**Throws:**');
    expect(md).not.toContain('**See also:**');
  });

  it('escapes pipe characters in parameter types', () => {
    const node = makeNode({
      id: 'src/test.ts:fn',
      name: 'fn',
      structuredParams: [
        { name: 'value', type: 'string | number', isOptional: false, isRest: false },
      ],
    });
    const graph = makeGraph([node]);
    const md = renderNodeMarkdown(node, graph);

    expect(md).toContain('`string \\| number`');
  });
});
