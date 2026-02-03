---
title: Generator
generated: 2026-02-03T11:45:43.491Z
dependencies:
  - path: /Users/fredrivett/code/FR/syncdocs/src/generator/index.ts
    symbol: Generator
    hash: 87c5819f181b9be8cf3d5c58f916cb907990b08e99c0286e598def9f3b04082f
---
# Generator

A core class that orchestrates the generation of AI-powered technical documentation for TypeScript symbols. It extracts symbol information from source code, generates documentation content using an AI client, and writes formatted markdown files with dependency tracking and frontmatter metadata.

<details>
<summary>Parameters</summary>

**Constructor Parameters:**

- `config: GeneratorConfig` - Configuration object containing:
  - `apiKey: string` - API key for the AI client
  - `model: string` - AI model to use for documentation generation
  - `outputDir: string` - Directory where generated documentation will be written
  - `style: string` - Documentation style guide for the AI to follow

</details>

<details>
<summary>Methods</summary>

### Public Methods

**`async generate(request: GenerateRequest): Promise<GenerationResult>`**
- Generates documentation for a single symbol
- Handles errors and returns success/failure status
- Parameters:
  - `request: GenerateRequest` - Contains `symbol`, optional `context`, and optional `customPrompt`
- Returns: `GenerationResult` with `success: boolean`, optional `filePath: string`, and optional `error: string`

**`async generateForFile(filePath: string): Promise<GenerationResult[]>`**
- Extracts all symbols from a file and generates documentation for each
- Parameters:
  - `filePath: string` - Path to the TypeScript file to process
- Returns: Array of `GenerationResult` objects, one for each symbol found

**`async getGitCommit(): Promise<string | undefined>`**
- Retrieves the current git commit hash if the project is in a git repository
- Returns the commit hash or `undefined` if not in a git repo or git command fails

### Private Methods

**`async generateDoc(request: GenerateRequest): Promise<GeneratedDoc>`**
- Core documentation generation logic
- Coordinates AI content generation, dependency tracking, and file path creation

**`writeDoc(doc: GeneratedDoc): void`**
- Writes documentation to filesystem with YAML frontmatter
- Creates output directories as needed

**`generateFrontmatter(doc: GeneratedDoc): string`**
- Creates YAML frontmatter with title, generation timestamp, and dependencies

**`generateFilePath(symbol: SymbolInfo, fileName: string): string`**
- Generates output file path preserving the source directory structure

**`generateFileName(symbol: SymbolInfo): string`**
- Converts symbol names to kebab-case markdown filenames

**`extractTitle(content: string): string | null`**
- Extracts title from markdown content by finding the first H1 heading

</details>

<details>
<summary>Usage Examples</summary>

```typescript
// Basic setup and single symbol generation
const config: GeneratorConfig = {
  apiKey: 'your-api-key',
  model: 'gpt-4',
  outputDir: './docs',
  style: 'technical'
};

const generator = new Generator(config);

// Generate documentation for a specific symbol
const result = await generator.generate({
  symbol: symbolInfo,
  context: {
    projectContext: 'This is a documentation generator tool',
    relatedSymbols: [relatedSymbol1, relatedSymbol2]
  }
});

if (result.success) {
  console.log(`Documentation written to: ${result.filePath}`);
} else {
  console.error(`Generation failed: ${result.error}`);
}
```

```typescript
// Generate documentation for an entire file
const results = await generator.generateForFile('./src/components/Button.ts');

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Symbol ${index + 1}: Generated successfully`);
  } else {
    console.error(`Symbol ${index + 1}: ${result.error}`);
  }
});
```

```typescript
// Using custom prompts
const customResult = await generator.generate({
  symbol: symbolInfo,
  customPrompt: 'Focus on performance considerations and best practices'
});
```

</details>

<details>
<summary>Implementation Details</summary>

The `Generator` class uses a composition pattern with three key dependencies:

- **`TypeScriptExtractor`** - Parses TypeScript files and extracts symbol information
- **`ContentHasher`** - Creates content hashes for dependency tracking and change detection  
- **`AIClient`** - Interfaces with AI services to generate documentation content

The documentation generation flow:
1. Extract symbol information using `TypeScriptExtractor`
2. Generate content via `AIClient` with symbol data and configuration
3. Create dependency entries with content hashes for change tracking
4. Generate output file paths preserving source directory structure
5. Write files with YAML frontmatter containing metadata and dependencies

**File Organization:**
- Output files maintain the same directory structure as source files
- Symbol names are converted to kebab-case for filenames (`MyClass` → `my-class.md`)
- Files include YAML frontmatter with generation metadata and dependency tracking

**Error Handling:**
- All public methods return result objects with success/failure status
- Errors are caught and converted to user-friendly messages
- File system operations include directory creation and error recovery

</details>

<details>
<summary>Edge Cases</summary>

- **Empty files**: `generateForFile()` returns an error result when no symbols are found
- **Invalid file paths**: File system errors are caught and returned as error results
- **Git repository detection**: `getGitCommit()` gracefully handles non-git directories
- **Missing output directories**: Automatically creates directory structure using `mkdirSync` with `recursive: true`
- **Symbol name conflicts**: File paths include directory structure to avoid naming collisions
- **Special characters in symbol names**: Kebab-case conversion handles camelCase and PascalCase appropriately
- **Missing titles**: Falls back to symbol name if no H1 heading is found in generated content
- **AI generation failures**: Errors from `AIClient` are propagated up and handled gracefully

</details>

<details>
<summary>Related</summary>

- `TypeScriptExtractor` - Extracts symbol information from TypeScript source files
- `ContentHasher` - Generates hashes for change detection and dependency tracking
- `AIClient` - Handles communication with AI services for content generation
- `GeneratorConfig` - Configuration interface for the generator
- `GenerateRequest` - Request interface for single symbol generation
- `GenerationResult` - Result interface returned by generation methods
- `SymbolInfo` - Interface representing extracted symbol data
- `GeneratedDoc` - Internal interface for documentation with metadata

</details>