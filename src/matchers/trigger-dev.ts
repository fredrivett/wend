/**
 * Trigger.dev framework matcher
 *
 * Detects:
 * - Task definitions (task({ id: "...", run: ... }))
 * - Task triggers (tasks.trigger("task-id") / tasks.triggerAndWait("task-id"))
 * - Batch triggers (tasks.batchTrigger("task-id"))
 */

import type { SymbolInfo } from '../extractor/types.js';
import type {
  EntryPointMatch,
  FrameworkMatcher,
  ResolvedConnection,
  RuntimeConnection,
} from './types.js';

/**
 * Extract the task ID from a task() definition.
 * Looks for: task({ id: "process-image", ... })
 */
function extractTaskId(body: string): string | null {
  const idMatch = body.match(/id\s*:\s*['"`]([^'"`]+)['"`]/);
  return idMatch ? idMatch[1] : null;
}

export const triggerDevMatcher: FrameworkMatcher = {
  name: 'trigger-dev',

  detectEntryPoint(symbol: SymbolInfo, _filePath: string): EntryPointMatch | null {
    // Detect task({ id: "...", run: ... }) definitions
    // These are extracted as kind: 'const' with body containing task(
    if (symbol.kind === 'const' && /^task\s*\(/.test(symbol.body)) {
      const taskId = extractTaskId(symbol.body);

      return {
        entryType: 'trigger-task',
        metadata: {
          ...(taskId && { taskId }),
        },
      };
    }

    return null;
  },

  detectConnections(symbol: SymbolInfo, _filePath: string): RuntimeConnection[] {
    const connections: RuntimeConnection[] = [];

    // Detect tasks.trigger("task-id"), tasks.triggerAndWait("task-id"), tasks.batchTrigger("task-id")
    // Also handles TypeScript generics: tasks.trigger<typeof fooTask>("task-id")
    const triggerPattern =
      /\.(?:trigger|triggerAndWait|batchTrigger)\s*(?:<[^>]*>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match: RegExpExecArray | null;
    match = triggerPattern.exec(symbol.body);
    while (match !== null) {
      connections.push({
        type: 'task-trigger',
        targetHint: match[1],
        sourceLocation: [symbol.startLine, symbol.endLine],
      });
      match = triggerPattern.exec(symbol.body);
    }

    return connections;
  },

  resolveConnection(
    _connection: RuntimeConnection,
    _projectFiles: string[],
  ): ResolvedConnection | null {
    // TODO: resolve task trigger strings to task definitions
    return null;
  },
};
