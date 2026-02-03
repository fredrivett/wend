/**
 * Documentation generator - creates docs using AI
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { TypeScriptExtractor } from '../extractor/index.js';
import type { SymbolInfo } from '../extractor/types.js';
import { ContentHasher } from '../hasher/index.js';
import { AIClient } from './ai-client.js';
import type {
  DocDependency,
  GeneratedDoc,
  GenerateRequest,
  GenerationResult,
  GeneratorConfig,
} from './types.js';

export class Generator {
  private extractor: TypeScriptExtractor;
  private hasher: ContentHasher;
  private aiClient: AIClient;
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.extractor = new TypeScriptExtractor();
    this.hasher = new ContentHasher();
    this.aiClient = new AIClient({
      apiKey: config.apiKey,
      model: config.model,
    });
  }

  /**
   * Generate documentation for a symbol
   */
  async generate(request: GenerateRequest): Promise<GenerationResult> {
    try {
      const doc = await this.generateDoc(request);
      this.writeDoc(doc);

      return {
        success: true,
        filePath: doc.filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate documentation for all symbols in a file
   */
  async generateForFile(filePath: string): Promise<GenerationResult[]> {
    const result = this.extractor.extractSymbols(filePath);

    if (result.symbols.length === 0) {
      return [
        {
          success: false,
          error: `No symbols found in ${filePath}`,
        },
      ];
    }

    const results: GenerationResult[] = [];

    for (const symbol of result.symbols) {
      const result = await this.generate({ symbol });
      results.push(result);
    }

    return results;
  }

  /**
   * Generate doc content and metadata
   */
  private async generateDoc(request: GenerateRequest): Promise<GeneratedDoc> {
    const { symbol, context, customPrompt } = request;

    // Generate documentation content using AI
    const content = await this.aiClient.generateDoc({
      symbol,
      style: this.config.style,
      projectContext: context?.projectContext,
      customPrompt,
    });

    // Create dependency entry with hash
    const dependencies: DocDependency[] = [
      {
        path: symbol.filePath,
        symbol: symbol.name,
        hash: this.hasher.hashSymbol(symbol),
      },
    ];

    // Add related symbols as dependencies if provided
    if (context?.relatedSymbols) {
      for (const relatedSymbol of context.relatedSymbols) {
        dependencies.push({
          path: relatedSymbol.filePath,
          symbol: relatedSymbol.name,
          hash: this.hasher.hashSymbol(relatedSymbol),
        });
      }
    }

    // Generate file path
    const fileName = this.generateFileName(symbol);
    const filePath = join(this.config.outputDir, fileName);

    // Extract title from content or use symbol name
    const title = this.extractTitle(content) || symbol.name;

    return {
      filePath,
      title,
      content,
      dependencies,
    };
  }

  /**
   * Write documentation to file with frontmatter
   */
  private writeDoc(doc: GeneratedDoc): void {
    const frontmatter = this.generateFrontmatter(doc);
    const fullContent = `${frontmatter}\n${doc.content}`;

    // Ensure output directory exists
    const dir = dirname(doc.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(doc.filePath, fullContent, 'utf-8');
  }

  /**
   * Generate YAML frontmatter
   */
  private generateFrontmatter(doc: GeneratedDoc): string {
    const now = new Date().toISOString();

    let frontmatter = '---\n';
    frontmatter += `title: ${doc.title}\n`;
    frontmatter += `generated: ${now}\n`;
    frontmatter += `dependencies:\n`;

    for (const dep of doc.dependencies) {
      frontmatter += `  - path: ${dep.path}\n`;
      frontmatter += `    symbol: ${dep.symbol}\n`;
      frontmatter += `    hash: ${dep.hash}\n`;
      if (dep.asOf) {
        frontmatter += `    asOf: ${dep.asOf}\n`;
      }
    }

    frontmatter += '---';

    return frontmatter;
  }

  /**
   * Generate file name for a symbol
   */
  private generateFileName(symbol: SymbolInfo): string {
    // Convert symbol name to kebab-case
    const kebabName = symbol.name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    return `${kebabName}.md`;
  }

  /**
   * Extract title from markdown content
   * Looks for first h1 heading
   */
  private extractTitle(content: string): string | null {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : null;
  }

  /**
   * Get current git commit hash (if in git repo)
   */
  async getGitCommit(): Promise<string | undefined> {
    try {
      const { execSync } = await import('node:child_process');
      const commit = execSync('git rev-parse HEAD', {
        encoding: 'utf-8',
      }).trim();
      return commit;
    } catch {
      return undefined;
    }
  }
}

export { AIClient } from './ai-client.js';
export * from './types.js';
