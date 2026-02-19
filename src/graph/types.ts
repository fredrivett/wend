/**
 * Types for the project-wide call graph
 */

export interface GraphNode {
  id: string; // "src/api/analyze/route.ts:POST"
  name: string;
  kind: 'function' | 'class' | 'const' | 'method' | 'component';
  filePath: string;
  entryType?: EntryType;
  isAsync: boolean;
  hash: string;
  lineRange: [number, number];
  metadata?: EntryPointMetadata;
}

export type EntryType =
  | 'api-route'
  | 'page'
  | 'inngest-function'
  | 'trigger-task'
  | 'middleware'
  | 'server-action';

export interface EntryPointMetadata {
  httpMethod?: string;
  route?: string;
  eventTrigger?: string;
  taskId?: string;
}

export type EdgeType =
  | 'direct-call'
  | 'async-dispatch'
  | 'event-emit'
  | 'http-request'
  | 'conditional-call'
  | 'error-handler'
  | 'middleware-chain';

export interface GraphEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  type: EdgeType;
  label?: string;
  condition?: string; // "if user.isAdmin"
  isAsync: boolean;
  order?: number; // call order within source function
}

export interface FlowGraph {
  version: string;
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
