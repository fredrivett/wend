import { describe, expect, it } from 'vitest';
import type { SymbolEntry, SymbolIndex } from './index.js';
import { extractOverview, extractRelatedSymbols, generateDependencyGraph } from './index.js';

describe('extractOverview', () => {
  it('extracts text between title and first details block', () => {
    const content = `---
title: MyClass
generated: 2026-01-01
dependencies: []
---
# MyClass

This is the overview paragraph.

<details>
<summary>Visual Flow</summary>
Some content
</details>`;

    expect(extractOverview(content)).toBe('This is the overview paragraph.');
  });

  it('extracts multi-line overview', () => {
    const content = `---
title: Foo
---
# Foo

First line of overview.
Second line of overview.

<details>
<summary>Methods</summary>
</details>`;

    expect(extractOverview(content)).toBe('First line of overview.\nSecond line of overview.');
  });

  it('stops at ## heading', () => {
    const content = `---
title: Bar
---
# Bar

Overview text.

## Section`;

    expect(extractOverview(content)).toBe('Overview text.');
  });

  it('returns full text when no details or heading follows', () => {
    const content = `---
title: Simple
---
# Simple

Just an overview with no sections.`;

    expect(extractOverview(content)).toBe('Just an overview with no sections.');
  });

  it('handles empty overview', () => {
    const content = `---
title: Empty
---
# Empty

<details>
<summary>Visual Flow</summary>
</details>`;

    expect(extractOverview(content)).toBe('');
  });
});

describe('extractRelatedSymbols', () => {
  it('extracts backtick-wrapped symbol names', () => {
    const content = `
<details>
<summary>Related</summary>

- \`TypeScriptExtractor\` - Extracts symbols
- \`ContentHasher\` - Generates hashes

</details>`;

    expect(extractRelatedSymbols(content, 'Generator')).toEqual([
      'TypeScriptExtractor',
      'ContentHasher',
    ]);
  });

  it('extracts bold symbol names', () => {
    const content = `
<details>
<summary>Related</summary>

- **SymbolInfo Interface** - The input type
- **ContentHasher** - Generates hashes

</details>`;

    expect(extractRelatedSymbols(content, 'Generator')).toEqual(['SymbolInfo', 'ContentHasher']);
  });

  it('extracts both backtick and bold, deduplicating', () => {
    const content = `
<details>
<summary>Related</summary>

- \`ContentHasher\` - Generates hashes
- **ContentHasher** - Also mentioned in bold

</details>`;

    expect(extractRelatedSymbols(content, 'Generator')).toEqual(['ContentHasher']);
  });

  it('filters out self-references', () => {
    const content = `
<details>
<summary>Related</summary>

- \`SyncDocsError\` extends the native Error class
- \`instanceof\` operator for type checking \`SyncDocsError\` instances

</details>`;

    expect(extractRelatedSymbols(content, 'SyncDocsError')).toEqual([]);
  });

  it('strips () from function-style names', () => {
    const content = `
<details>
<summary>Related</summary>

- \`getPromptForStyle()\` - Generates prompts
- \`generateConfigYAML()\` - Converts config

</details>`;

    // These start with lowercase so won't match the [A-Z] pattern
    expect(extractRelatedSymbols(content, 'Foo')).toEqual([]);
  });

  it('extracts PascalCase function names with parens', () => {
    const content = `
<details>
<summary>Related</summary>

- \`MyHelper()\` - Does things

</details>`;

    expect(extractRelatedSymbols(content, 'Foo')).toEqual(['MyHelper']);
  });

  it('returns empty array when no Related section', () => {
    const content = `# Just a doc\n\nNo related section here.`;
    expect(extractRelatedSymbols(content, 'Foo')).toEqual([]);
  });
});

describe('generateDependencyGraph', () => {
  function makeIndex(entries: SymbolEntry[]): SymbolIndex {
    const entriesMap = new Map<string, SymbolEntry>();
    const byName = new Map<string, SymbolEntry[]>();
    for (const entry of entries) {
      entriesMap.set(entry.docPath, entry);
      const existing = byName.get(entry.name) ?? [];
      existing.push(entry);
      byName.set(entry.name, existing);
    }
    return { entries: entriesMap, byName };
  }

  const generatorEntry: SymbolEntry = {
    name: 'Generator',
    docPath: 'src/generator/index/generator.md',
    sourcePath: 'src/generator/index.ts',
    overview: 'A doc generator',
    related: ['TypeScriptExtractor', 'AIClient', 'ContentHasher'],
  };

  const extractorEntry: SymbolEntry = {
    name: 'TypeScriptExtractor',
    docPath: 'src/extractor/typescript-extractor/type-script-extractor.md',
    sourcePath: 'src/extractor/typescript-extractor.ts',
    overview: 'Extracts symbols',
    related: [],
  };

  const hasherEntry: SymbolEntry = {
    name: 'ContentHasher',
    docPath: 'src/hasher/index/content-hasher.md',
    sourcePath: 'src/hasher/index.ts',
    overview: 'Hashes content',
    related: [],
  };

  it('generates mermaid with click directives for documented symbols', () => {
    const index = makeIndex([generatorEntry, extractorEntry, hasherEntry]);
    const graph = generateDependencyGraph(generatorEntry, index);

    expect(graph).not.toBeNull();
    expect(graph).toContain('flowchart LR');
    expect(graph).toContain('Generator[Generator]:::current');
    expect(graph).toContain('TypeScriptExtractor[TypeScriptExtractor]');
    expect(graph).toContain('Generator --> TypeScriptExtractor');
    expect(graph).toContain('click TypeScriptExtractor href');
    expect(graph).toContain('ContentHasher[ContentHasher]');
    expect(graph).toContain('Generator --> ContentHasher');
    expect(graph).toContain('click ContentHasher href');
  });

  it('excludes related symbols that have no docs', () => {
    // AIClient is in related but not in the index
    const index = makeIndex([generatorEntry, extractorEntry]);
    const graph = generateDependencyGraph(generatorEntry, index)!;

    expect(graph).toContain('TypeScriptExtractor');
    expect(graph).not.toContain('AIClient');
  });

  it('returns null when no related symbols have docs', () => {
    const entry: SymbolEntry = {
      name: 'Lonely',
      docPath: 'lonely.md',
      sourcePath: 'lonely.ts',
      overview: '',
      related: ['NonExistent'],
    };
    const index = makeIndex([entry]);
    expect(generateDependencyGraph(entry, index)).toBeNull();
  });

  it('returns null when related list is empty', () => {
    const index = makeIndex([extractorEntry]);
    expect(generateDependencyGraph(extractorEntry, index)).toBeNull();
  });

  it('encodes doc paths in click directives', () => {
    const index = makeIndex([generatorEntry, extractorEntry]);
    const graph = generateDependencyGraph(generatorEntry, index)!;

    expect(graph).toContain(encodeURIComponent(extractorEntry.docPath));
  });
});
