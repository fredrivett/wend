---
title: Generator
generated: 2026-02-03T11:31:11.847Z
dependencies:
  - path: /Users/fredrivett/code/FR/syncdocs/src/generator/index.ts
    symbol: Generator
    hash: 87c5819f181b9be8cf3d5c58f916cb907990b08e99c0286e598def9f3b04082f
---
# Generator

A comprehensive documentation generator class that extracts TypeScript symbols and generates AI-powered documentation with dependency tracking and file management. It orchestrates the entire documentation generation pipeline from code analysis to markdown file output.

## Constructor

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `GeneratorConfig` | Configuration object containing API key, model settings, output directory, and documentation style preferences |

## Methods

### `generate(request: GenerateRequest): Promise<GenerationResult>`

Generates documentation for a single symbol with comprehensive error handling.

**Parameters:**
- `request` - Generation request containing symbol information, context, and optional custom prompts

**Returns:**
Promise resolving to a `GenerationResult` with success status and either file path or error message.

### `generateForFile(filePath: string): Promise<GenerationResult[]>`

Processes an entire TypeScript file and generates documentation for all extractable symbols.

**Parameters:**
- `filePath` - Absolute or relative path to the TypeScript source file

**Returns:**
Promise resolving to an array of `GenerationResult` objects, one for each symbol found.

<details>
<summary>Usage Examples</summary>

```typescript
// Initialize generator with configuration
const config: GeneratorConfig = {
  apiKey: 'your-api-key',
  model: 'gpt-4',
  outputDir: './docs',
  style: 'technical'
};

const generator = new Generator(config);

// Generate documentation for a single symbol
const symbolRequest: GenerateRequest = {
  symbol: {
    name: 'UserService',
    type: 'class',
    filePath: './src/services/user.service.ts',
    // ... other symbol properties
  },
  context: {
    projectContext: 'A REST API for user management',
    relatedSymbols: [/* related symbols */]
  }
};

const result = await generator.generate(symbolRequest);
if (result.success) {
  console.log(`Documentation generated at: ${result.filePath}`);
} else {
  console.error(`Generation failed: ${result.error}`);
}

// Generate documentation for entire file
const fileResults = await generator.generateForFile('./src/models/user.ts');
console.log(`Generated ${fileResults.length} documentation files`);
```

</details>

<details>
<summary>Implementation Details</summary>

The Generator class follows a multi-stage pipeline:

1. **Symbol Extraction**: Uses `TypeScriptExtractor` to parse source files and extract symbol metadata
2. **Content Generation**: Leverages `AIClient` to generate human-readable documentation based on symbol information and context
3. **Dependency Tracking**: Creates content hashes using `ContentHasher` to track changes and dependencies between symbols  
4. **File Management**: Preserves source directory structure in output, converts symbol names to kebab-case filenames
5. **Frontmatter Generation**: Adds YAML frontmatter with metadata including generation timestamp and dependency information

The class maintains internal state for all required services (extractor, hasher, AI client) and handles errors gracefully by wrapping operations in try-catch blocks.

File path generation preserves the original directory structure by:
- Extracting relative path from project root
- Combining with configured output directory  
- Converting symbol names to kebab-case markdown files

</details>

<details>
<summary>Edge Cases</summary>

**Empty Files**: When processing files with no extractable symbols, `generateForFile` returns a single failed result with descriptive error message.

**File System Errors**: The `writeDoc` method automatically creates missing directories using `mkdirSync` with recursive option.

**Git Integration**: The `getGitCommit` method gracefully handles non-git repositories by returning `undefined` instead of throwing errors.

**Symbol Name Conversion**: Complex symbol names with multiple capital letters are converted to kebab-case (e.g., `XMLHttpRequest` → `xml-http-request.md`).

**Title Extraction**: If no H1 heading is found in generated content, falls back to using the symbol name as the document title.

**Path Handling**: Handles both absolute and relative file paths by normalizing against the current working directory.

</details>

<details>
<summary>Related</summary>

- `TypeScriptExtractor` - Handles parsing and symbol extraction from TypeScript files
- `ContentHasher` - Provides content hashing for dependency tracking
- `AIClient` - Manages communication with AI services for content generation
- `GeneratorConfig` - Configuration interface for generator settings
- `GenerateRequest` - Request structure for single symbol generation
- `GenerationResult` - Response structure indicating success/failure and output details

</details>