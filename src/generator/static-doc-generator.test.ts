/**
 * Tests for static documentation generator markdown rendering
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FlowGraph, GraphNode } from '../graph/types.js';
import { StaticDocGenerator } from './static-doc-generator.js';

const TEST_DIR = join(process.cwd(), '.test-tmp-docs');

function makeNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: 'src/test.ts:testFunc',
    name: 'testFunc',
    kind: 'function',
    filePath: 'src/test.ts',
    isAsync: false,
    hash: 'abc123',
    lineRange: [1, 10],
    ...overrides,
  };
}

function makeGraph(nodes: GraphNode[] = [], edges: FlowGraph['edges'] = []): FlowGraph {
  return {
    version: '1.0',
    generatedAt: '2026-01-01T00:00:00.000Z',
    nodes,
    edges,
  };
}

function generateAndRead(node: GraphNode, graph?: FlowGraph): string {
  const generator = new StaticDocGenerator(TEST_DIR);
  const g = graph ?? makeGraph([node]);
  generator.generateForNode(node, g);
  const docPath = join(TEST_DIR, 'src/test/testFunc.md');
  return readFileSync(docPath, 'utf-8');
}

describe('StaticDocGenerator', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    try {
      if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    } catch (_e) {
      // Ignore cleanup errors
    }
  });

  describe('Description rendering', () => {
    it('should render description after title', () => {
      const node = makeNode({ description: 'Adds two numbers together.' });
      const content = generateAndRead(node);
      expect(content).toContain('Adds two numbers together.');
      const titleIndex = content.indexOf('# testFunc');
      const descIndex = content.indexOf('Adds two numbers together.');
      expect(descIndex).toBeGreaterThan(titleIndex);
    });

    it('should not render description section when undefined', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      // Content after the title should not contain a freestanding paragraph
      const afterTitle = content.split('# testFunc')[1];
      const nonEmptyLines = afterTitle.split('\n').filter((l) => l.trim() !== '');
      for (const line of nonEmptyLines) {
        const isMarkdown =
          line.startsWith('*') ||
          line.startsWith('|') ||
          line.startsWith('#') ||
          line.startsWith('>') ||
          line.startsWith('`') ||
          line.startsWith('-') ||
          line.startsWith('```');
        expect(isMarkdown || line.trim() === '').toBe(true);
      }
    });
  });

  describe('Export frontmatter', () => {
    it('should include exported: true in frontmatter when isExported is true', () => {
      const node = makeNode({ isExported: true });
      const content = generateAndRead(node);
      expect(content).toMatch(/^---[\s\S]*exported: true[\s\S]*---/);
    });

    it('should not include exported in frontmatter when isExported is false', () => {
      const node = makeNode({ isExported: false });
      const content = generateAndRead(node);
      expect(content).not.toMatch(/^---[\s\S]*exported:[\s\S]*---/);
    });

    it('should not include exported in frontmatter when isExported is undefined', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      expect(content).not.toMatch(/^---[\s\S]*exported:[\s\S]*---/);
    });
  });

  describe('Deprecated frontmatter', () => {
    it('should include deprecated: true in frontmatter when deprecated is true', () => {
      const node = makeNode({ deprecated: true });
      const content = generateAndRead(node);
      expect(content).toMatch(/^---[\s\S]*deprecated: true[\s\S]*---/);
    });

    it('should include deprecated reason in frontmatter when deprecated is a string', () => {
      const node = makeNode({ deprecated: 'Use newFunc instead' });
      const content = generateAndRead(node);
      expect(content).toMatch(/^---[\s\S]*deprecated: Use newFunc instead[\s\S]*---/);
    });

    it('should not include deprecated in frontmatter when not set', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      expect(content).not.toMatch(/^---[\s\S]*deprecated:[\s\S]*---/);
    });
  });

  describe('Parameters table rendering', () => {
    it('should render parameters table with all columns', () => {
      const node = makeNode({
        structuredParams: [
          { name: 'name', type: 'string', isOptional: false, isRest: false },
          { name: 'age', type: 'number', isOptional: true, isRest: false },
        ],
      });
      const content = generateAndRead(node);
      expect(content).toContain('**Parameters:**');
      expect(content).toContain('| Name | Type | Required | Description |');
      expect(content).toContain('| name | `string` | Yes |');
      expect(content).toContain('| age | `number` | No |');
    });

    it('should render rest param with ... prefix', () => {
      const node = makeNode({
        structuredParams: [{ name: 'items', type: 'number[]', isOptional: false, isRest: true }],
      });
      const content = generateAndRead(node);
      expect(content).toContain('| ...items | `number[]` | Yes |');
    });

    it('should render default value in description', () => {
      const node = makeNode({
        structuredParams: [
          {
            name: 'currency',
            type: 'string',
            isOptional: true,
            isRest: false,
            defaultValue: "'USD'",
          },
        ],
      });
      const content = generateAndRead(node);
      expect(content).toContain("(default: `'USD'`)");
    });

    it('should render JSDoc description in description column', () => {
      const node = makeNode({
        structuredParams: [
          {
            name: 'name',
            type: 'string',
            isOptional: false,
            isRest: false,
            description: 'The user name',
          },
        ],
      });
      const content = generateAndRead(node);
      expect(content).toContain('The user name');
    });

    it('should not render parameters section when structuredParams is empty', () => {
      const node = makeNode({ structuredParams: [] });
      const content = generateAndRead(node);
      expect(content).not.toContain('**Parameters:**');
    });

    it('should not render parameters section when structuredParams is undefined', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      expect(content).not.toContain('**Parameters:**');
    });
  });

  describe('Return type rendering', () => {
    it('should render return type', () => {
      const node = makeNode({ returnType: 'number' });
      const content = generateAndRead(node);
      expect(content).toContain('**Returns:** `number`');
    });

    it('should not render return type when undefined', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      expect(content).not.toContain('**Returns:**');
    });
  });

  describe('Examples rendering', () => {
    it('should render examples as fenced code blocks', () => {
      const node = makeNode({ examples: ['add(1, 2) // returns 3'] });
      const content = generateAndRead(node);
      expect(content).toContain('**Examples:**');
      expect(content).toContain('```typescript');
      expect(content).toContain('add(1, 2) // returns 3');
      expect(content).toContain('```');
    });

    it('should render multiple examples', () => {
      const node = makeNode({ examples: ['add(1, 2)', 'add(3, 4)'] });
      const content = generateAndRead(node);
      expect(content).toContain('add(1, 2)');
      expect(content).toContain('add(3, 4)');
      // Should have two fenced blocks
      const matches = content.match(/```typescript/g);
      expect(matches).toHaveLength(2);
    });

    it('should not render examples when empty', () => {
      const node = makeNode({ examples: [] });
      const content = generateAndRead(node);
      expect(content).not.toContain('**Examples:**');
    });
  });

  describe('Throws rendering', () => {
    it('should render throws as bullet list', () => {
      const node = makeNode({ throws: ['When input is invalid'] });
      const content = generateAndRead(node);
      expect(content).toContain('**Throws:**');
      expect(content).toContain('- When input is invalid');
    });

    it('should not render throws when empty', () => {
      const node = makeNode({ throws: [] });
      const content = generateAndRead(node);
      expect(content).not.toContain('**Throws:**');
    });
  });

  describe('See also rendering', () => {
    it('should render see as bullet list', () => {
      const node = makeNode({ see: ['otherFunction', 'https://example.com'] });
      const content = generateAndRead(node);
      expect(content).toContain('**See also:**');
      expect(content).toContain('- otherFunction');
      expect(content).toContain('- https://example.com');
    });

    it('should not render see when empty', () => {
      const node = makeNode({ see: [] });
      const content = generateAndRead(node);
      expect(content).not.toContain('**See also:**');
    });
  });

  describe('Entry point metadata in frontmatter', () => {
    it('should include entryType and httpMethod in frontmatter', () => {
      const node = makeNode({
        entryType: 'api-route',
        metadata: { httpMethod: 'POST', route: '/api/users' },
      });
      const content = generateAndRead(node);
      expect(content).toMatch(/^---[\s\S]*entryType: api-route[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*httpMethod: POST[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*route: \/api\/users[\s\S]*---/);
    });

    it('should include eventTrigger and taskId in frontmatter', () => {
      const node = makeNode({
        entryType: 'trigger-task',
        metadata: { eventTrigger: 'user.created', taskId: 'process-user' },
      });
      const content = generateAndRead(node);
      expect(content).toMatch(/^---[\s\S]*entryType: trigger-task[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*eventTrigger: user.created[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*taskId: process-user[\s\S]*---/);
    });

    it('should omit entry point fields when not set', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      expect(content).not.toMatch(/^---[\s\S]*entryType:[\s\S]*---/);
      expect(content).not.toMatch(/^---[\s\S]*httpMethod:[\s\S]*---/);
      expect(content).not.toMatch(/^---[\s\S]*route:[\s\S]*---/);
      expect(content).not.toMatch(/^---[\s\S]*eventTrigger:[\s\S]*---/);
      expect(content).not.toMatch(/^---[\s\S]*taskId:[\s\S]*---/);
    });
  });

  describe('Backward compatibility', () => {
    it('should produce valid output with no new fields', () => {
      const node = makeNode();
      const content = generateAndRead(node);
      // Should have frontmatter with kind, title
      expect(content).toMatch(/^---[\s\S]*kind: function[\s\S]*---/);
      expect(content).toContain('# testFunc');
      // Should NOT have optional frontmatter fields
      expect(content).not.toMatch(/^---[\s\S]*exported:[\s\S]*---/);
      expect(content).not.toMatch(/^---[\s\S]*deprecated:[\s\S]*---/);
      // Should NOT have body sections
      expect(content).not.toContain('**Parameters:**');
      expect(content).not.toContain('**Returns:**');
      expect(content).not.toContain('**Examples:**');
      expect(content).not.toContain('**Throws:**');
      expect(content).not.toContain('**See also:**');
    });
  });

  describe('Section ordering', () => {
    it('should render all body sections in correct order', () => {
      const node = makeNode({
        isExported: true,
        deprecated: 'Use v2',
        description: 'A test function.',
        structuredParams: [{ name: 'x', type: 'number', isOptional: false, isRest: false }],
        returnType: 'number',
        isAsync: true,
        examples: ['testFunc(1)'],
        throws: ['On error'],
        see: ['otherFunc'],
      });
      const otherNode = makeNode({ id: 'src/test.ts:otherFunc', name: 'otherFunc' });
      const graph = makeGraph(
        [node, otherNode],
        [
          {
            id: 'e1',
            source: node.id,
            target: otherNode.id,
            type: 'direct-call',
            isAsync: false,
          },
        ],
      );

      const generator = new StaticDocGenerator(TEST_DIR);
      generator.generateForNode(node, graph);
      const content = readFileSync(join(TEST_DIR, 'src/test/testFunc.md'), 'utf-8');

      // Badge metadata should be in frontmatter, not body
      expect(content).toMatch(/^---[\s\S]*kind: function[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*exported: true[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*async: true[\s\S]*---/);
      expect(content).toMatch(/^---[\s\S]*deprecated: Use v2[\s\S]*---/);

      // Verify body section ordering by finding indices
      const titleIdx = content.indexOf('# testFunc');
      const descIdx = content.indexOf('A test function.');
      const paramsIdx = content.indexOf('**Parameters:**');
      const returnsIdx = content.indexOf('**Returns:**');
      const callsIdx = content.indexOf('**Calls:**');
      const examplesIdx = content.indexOf('**Examples:**');
      const throwsIdx = content.indexOf('**Throws:**');
      const seeIdx = content.indexOf('**See also:**');

      expect(titleIdx).toBeLessThan(descIdx);
      expect(descIdx).toBeLessThan(paramsIdx);
      expect(paramsIdx).toBeLessThan(returnsIdx);
      expect(returnsIdx).toBeLessThan(callsIdx);
      expect(callsIdx).toBeLessThan(examplesIdx);
      expect(examplesIdx).toBeLessThan(throwsIdx);
      expect(throwsIdx).toBeLessThan(seeIdx);
    });
  });
});
