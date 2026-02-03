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
        max_tokens: 4096,
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

    prompt += `Generate documentation that includes:\n`;
    prompt += `1. A clear h1 title using the symbol name\n`;
    prompt += `2. A brief overview (2-3 sentences) of what this ${symbol.kind} does\n`;
    prompt += `3. Parameters section (if applicable) with descriptions\n`;
    prompt += `4. Return value section (if applicable)\n`;
    prompt += `5. Usage examples in collapsible sections\n`;
    prompt += `6. Implementation details in a collapsible section\n`;
    prompt += `7. Edge cases and notes in a collapsible section (if applicable)\n\n`;

    prompt += `IMPORTANT: Use collapsible sections for detailed content to keep docs scannable.\n`;
    prompt += `Use this syntax for collapsible sections:\n`;
    prompt += `<details>\n<summary>Section Title</summary>\n\nContent here\n\n</details>\n\n`;

    prompt += `Recommended collapsible sections:\n`;
    prompt += `- "Usage Examples" - Multiple code examples\n`;
    prompt += `- "Implementation Details" - How it works internally\n`;
    prompt += `- "Edge Cases" - Special cases and gotchas\n`;
    prompt += `- "Related" - Related functions or concepts\n\n`;

    prompt += `Format the documentation in clean markdown. Do NOT include frontmatter or metadata - just the documentation content.\n`;

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
