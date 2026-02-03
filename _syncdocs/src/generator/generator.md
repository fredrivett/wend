---
title: Generator
generated: 2026-02-03T11:40:24.919Z
dependencies:
  - path: /Users/fredrivett/code/FR/syncdocs/src/generator/index.ts
    symbol: Generator
    hash: 87c5819f181b9be8cf3d5c58f916cb907990b08e99c0286e598def9f3b04082f
---
# Generator

The `Generator` class is the main orchestrator for automated documentation generation from TypeScript source code. It combines code extraction, AI-powered content generation, and file system operations to produce structured markdown documentation with dependency tracking and version control integration.

<details>
<summary>Constructor Parameters</summary>

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `GeneratorConfig` | Configuration object containing API key, model settings, output directory, and documentation style preferences |

</details>

<details>
<summary>Methods</summary>

### `generate(request: GenerateRequest): Promise<GenerationResult>`

Generates documentation for a single symbol.

**Parameters:**
- `request` - Object containing the symbol to document, optional context, and custom prompts

**Returns:** Promise resolving to a `GenerationResult` indicating success/failure and output file path

### `generateForFile(filePath: string): Promise<GenerationResult[]>`

Extracts all symbols from a TypeScript file and generates documentation for each one.

**Parameters:**
- `filePath` - Path to the TypeScript source file to process

**Returns:** Promise resolving to an array of `GenerationResult` objects, one per symbol found

### `getGitCommit(): Promise<string | undefined>`

Retrieves the current Git commit hash if the project is in a Git repository.

**Returns:** Promise resolving to the commit hash string, or `undefined` if not in a Git repo or Git is unavailable

</details>

<details>
<summary>Usage Examples</summary>

```typescript
import { Generator } from './generator';

// Basic setup
const generator = new Generator({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  outputDir: './docs',
  style: 'technical'
});

// Generate docs for a specific symbol
const result = await generator.generate({
  symbol: {
    name: 'UserService',
    type: 'class',
    filePath: './src/services/user.service.ts',
    // ... other symbol properties
  }
});

if (result.success) {
  console.log(`Documentation generated: ${result.filePath}`);
} else {
  console.error(`Generation failed: ${result.error}`);
}
```

```typescript
// Generate docs for all symbols in a file
const results = await generator.generateForFile('./src/utils/helpers.ts');

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Symbol ${index + 1}: ${result.filePath}`);
  } else {
    console.error(`Symbol ${index + 1} failed: ${result.error}`);
  }
});
```

```typescript
// Generate with context and custom prompts
const result = await generator.generate({
  symbol: mySymbol,
  context: {
    projectContext: 'This is a REST API service',
    relatedSymbols: [userModel, authService]
  },
  customPrompt: 'Focus on security considerations and error handling'
});
```

</details>

<details>
<summary>Implementation Details</summary>

The `Generator` class follows a multi-stage pipeline:

1. **Symbol Processing**: Uses `TypeScriptExtractor` to parse and extract symbol information from source files
2. **Content Generation**: Leverages `AIClient` to generate human-readable documentation using the configured AI model
3. **Dependency Tracking**: Creates hash-based dependency records using `ContentHasher` for change detection
4. **File Organization**: Preserves source directory structure in the output, converting symbol names to kebab-case filenames
5. **Frontmatter Generation**: Adds YAML metadata including title, generation timestamp, and dependency information
6. **File System Operations**: Ensures output directories exist and writes complete markdown files

The class maintains internal state through four key components:
- `TypeScriptExtractor` for code analysis
- `ContentHasher` for change detection
- `AIClient` for content generation  
- `GeneratorConfig` for behavior configuration

</details>

<details>
<summary>Edge Cases</summary>

- **Empty Files**: Returns an error result when no extractable symbols are found in a source file
- **File System Errors**: Catches and converts exceptions to structured error results rather than throwing
- **Git Integration**: Gracefully handles projects not in Git repositories or missing Git installation
- **Directory Structure**: Automatically creates nested output directories to match source file organization
- **Symbol Name Conflicts**: Uses file path preservation to avoid naming collisions in output
- **Invalid Symbols**: Processes each symbol independently, so one failure doesn't block others in batch operations

</details>

<details>
<summary>Related</summary>

- `TypeScriptExtractor` - Handles source code parsing and symbol extraction
- `AIClient` - Manages communication with AI services for content generation
- `ContentHasher` - Provides content-based change detection for incremental updates
- `GeneratorConfig` - Configuration interface defining generation behavior
- `GenerateRequest` - Input structure for single symbol generation requests
- `GenerationResult` - Output structure indicating success/failure and file paths

</details>