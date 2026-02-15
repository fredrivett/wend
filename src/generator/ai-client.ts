/**
 * AI client for calling Anthropic API
 */

import type { SymbolInfo } from '../extractor/types.js';

export interface AIClientConfig {
  apiKey: string;
  model?: string;
}

export interface GenerateDocRequest {
  symbol: SymbolInfo;
  style?: 'technical' | 'beginner-friendly' | 'comprehensive';
  projectContext?: string;
  customPrompt?: string;
}

export class AIClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(config: AIClientConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  /**
   * Generate documentation for a symbol using Claude
   */
  async generateDoc(request: GenerateDocRequest): Promise<string> {
    const prompt = this.buildPrompt(request);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.extractContent(data);
  }

  /**
   * Build the prompt for documentation generation
   */
  private buildPrompt(request: GenerateDocRequest): string {
    const { symbol, style = 'technical', projectContext, customPrompt } = request;

    if (customPrompt) {
      return customPrompt;
    }

    const styleGuidance = {
      technical:
        'Write clear, technical documentation for experienced developers. Focus on accuracy and completeness.',
      'beginner-friendly':
        'Write documentation that is easy to understand for beginners. Include examples and explanations.',
      comprehensive:
        'Write comprehensive documentation covering all aspects, use cases, and edge cases.',
    };

    let prompt = `You are a technical documentation writer. Generate markdown documentation for the following ${symbol.kind}.\n\n`;

    if (projectContext) {
      prompt += `Project context: ${projectContext}\n\n`;
    }

    prompt += `Style: ${styleGuidance[style]}\n\n`;
    prompt += `Symbol name: ${symbol.name}\n`;
    prompt += `Type: ${symbol.kind}\n`;

    if (symbol.params) {
      prompt += `Parameters: ${symbol.params}\n`;
    }

    prompt += `\nSource code:\n\`\`\`typescript\n${symbol.fullText}\n\`\`\`\n\n`;

    prompt += `Generate documentation with the following structure:\n\n`;
    prompt += `1. A clear h1 title using the symbol name\n`;
    prompt += `2. A brief overview (2-3 sentences) of what this ${symbol.kind} does - VISIBLE BY DEFAULT\n`;
    prompt += `3. ALL other content in collapsible sections\n\n`;

    prompt += `IMPORTANT: Only the title and overview should be visible by default. Everything else must be in collapsible sections.\n\n`;

    prompt += `Use this syntax for collapsible sections:\n`;
    prompt += `<details>\n<summary>Section Title</summary>\n\nContent here\n\n</details>\n\n`;

    prompt += `Required collapsible sections (as applicable), in this order:\n`;
    prompt += `- "Visual Flow" - A mermaid flowchart diagram showing the internal flow of this ${symbol.kind}. THIS MUST BE THE FIRST COLLAPSIBLE SECTION, immediately after the overview.\n`;
    prompt += `  For functions: Show the execution flow including key decision points, async operations, error handling paths, and calls to external functions/methods.\n`;
    prompt += `  For classes: Show how methods relate to each other (which methods call which) and key external dependencies. Wrap all method flows in a single subgraph labeled with the class name so they are visually grouped together.\n`;
    prompt += `  Use \`\`\`mermaid code fence with flowchart TD (top-down) orientation. Keep node labels short and readable. Use dashed lines (-.->)  for error/exception paths.\n`;
    prompt += `  STYLING: Apply mermaid style declarations for visual clarity:\n`;
    prompt += `    - Start/entry node: soft blue fill. Example: style Start fill:#BBDEFB,stroke:#64B5F6,color:#333\n`;
    prompt += `    - Normal flow nodes: soft purple/lavender fill. Example: style A fill:#E8DEEE,stroke:#B39DDB,color:#333\n`;
    prompt += `    - Error/exception nodes: soft pink/red fill. Example: style ErrNode fill:#FCE4EC,stroke:#E57373,color:#333\n`;
    prompt += `    - Final return node: soft green fill. Example: style Return fill:#C8E6C9,stroke:#81C784,color:#333\n`;
    prompt += `    - Keep styles consistent — define them at the end of the flowchart after all edges.\n`;
    prompt += `  FILE SUBGRAPHS: When the function calls symbols from other files (cross-file calls), group nodes into subgraphs labeled with the source file path to show how execution crosses file boundaries. Example:\n`;
    prompt += `    subgraph "lib/vision.ts"\n      A[analyzeImage] --> B[getVisionClient]\n    end\n`;
    prompt += `    subgraph "lib/search/color-utils.ts"\n      C[getNearestColorName]\n    end\n`;
    prompt += `    B --> C\n`;
    prompt += `- "Parameters" - Parameter descriptions (if applicable)\n`;
    prompt += `- "Methods" - Method descriptions for classes (if applicable)\n`;
    prompt += `- "Return Value" - What the function/method returns (if applicable)\n`;
    prompt += `- "Usage Examples" - Multiple code examples\n`;
    prompt += `- "Implementation Details" - How it works internally\n`;
    prompt += `- "Edge Cases" - Special cases and gotchas\n`;
    prompt += `- "Related" - Related functions or concepts\n\n`;

    prompt += `FORMATTING REQUIREMENTS:\n`;
    prompt += `- Use inline code backticks for ALL code-related elements:\n`;
    prompt += `  - Method/function signatures: \`methodName(param: Type): ReturnType\`\n`;
    prompt += `  - Parameter names: \`paramName\`\n`;
    prompt += `  - Type names: \`string\`, \`number\`, \`SymbolInfo\`, etc.\n`;
    prompt += `  - Property names: \`config.apiKey\`\n`;
    prompt += `  - Class names: \`ContentHasher\`\n`;
    prompt += `  - Boolean values: \`true\`, \`false\`, \`null\`, \`undefined\`\n`;
    prompt += `- Apply backticks in headings, descriptions, and all text content\n`;
    prompt += `- Use triple backticks with language identifier for code blocks\n`;
    prompt += `- Do NOT include frontmatter or metadata - just the documentation content\n`;

    return prompt;
  }

  /**
   * Extract content from Anthropic API response
   */
  private extractContent(data: any): string {
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error('Invalid response from Anthropic API: no content');
    }

    const textBlock = data.content.find((block: any) => block.type === 'text');
    if (!textBlock || !textBlock.text) {
      throw new Error('Invalid response from Anthropic API: no text block');
    }

    return textBlock.text;
  }
}
