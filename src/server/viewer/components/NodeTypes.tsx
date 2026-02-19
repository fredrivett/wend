import { Handle, type NodeProps, Position } from '@xyflow/react';

interface NodeData {
  label: string;
  kind: string;
  filePath: string;
  isAsync: boolean;
  entryType?: string;
  metadata?: {
    httpMethod?: string;
    route?: string;
    eventTrigger?: string;
    taskId?: string;
  };
  highlighted?: boolean;
}

const methodColors: Record<string, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  PATCH: '#f59e0b',
  DELETE: '#ef4444',
};

const entryTypeLabels: Record<string, string> = {
  'api-route': 'API',
  page: 'Page',
  'inngest-function': 'Inngest',
  'trigger-task': 'Trigger',
  middleware: 'Middleware',
  'server-action': 'Action',
};

const entryTypeColors: Record<string, string> = {
  'api-route': '#3b82f6',
  page: '#8b5cf6',
  'inngest-function': '#ec4899',
  'trigger-task': '#f97316',
  middleware: '#06b6d4',
  'server-action': '#10b981',
};

function EntryPointNode({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  const color = d.entryType ? entryTypeColors[d.entryType] || '#6b7280' : '#6b7280';
  const typeLabel = d.entryType ? entryTypeLabels[d.entryType] || d.entryType : '';
  const httpMethod = d.metadata?.httpMethod;
  const route = d.metadata?.route;
  const eventTrigger = d.metadata?.eventTrigger;
  const taskId = d.metadata?.taskId;

  return (
    <div
      style={{
        background: d.highlighted ? '#fefce8' : '#ffffff',
        border: `2px solid ${color}`,
        borderRadius: 12,
        padding: '10px 14px',
        minWidth: 160,
        boxShadow: d.highlighted
          ? `0 0 0 3px ${color}40, 0 4px 12px rgba(0,0,0,0.1)`
          : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            background: color,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {typeLabel}
        </span>
        {httpMethod && (
          <span
            style={{
              background: methodColors[httpMethod] || '#6b7280',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {httpMethod}
          </span>
        )}
        {d.isAsync && (
          <span
            style={{
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: 10,
              padding: '2px 5px',
              borderRadius: 4,
            }}
          >
            async
          </span>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{d.label}</div>
      {(route || eventTrigger || taskId) && (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          {route || eventTrigger || taskId}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.filePath}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}

function ComponentNode({ data }: NodeProps) {
  const d = data as unknown as NodeData;

  return (
    <div
      style={{
        background: d.highlighted ? '#f5f3ff' : '#ffffff',
        border: `1.5px solid ${d.highlighted ? '#7c3aed' : '#8b5cf6'}`,
        borderRadius: 10,
        padding: '8px 12px',
        minWidth: 140,
        boxShadow: d.highlighted
          ? '0 0 0 2px #8b5cf640, 0 2px 8px rgba(0,0,0,0.08)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span
          style={{
            background: '#ede9fe',
            color: '#7c3aed',
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          Component
        </span>
        {d.isAsync && (
          <span
            style={{
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: 10,
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            async
          </span>
        )}
      </div>
      <div style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>{d.label}</div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.filePath}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#8b5cf6' }} />
    </div>
  );
}

function HookNode({ data }: NodeProps) {
  const d = data as unknown as NodeData;

  return (
    <div
      style={{
        background: d.highlighted ? '#f0fdfa' : '#ffffff',
        border: `1.5px solid ${d.highlighted ? '#0f766e' : '#0d9488'}`,
        borderRadius: 10,
        padding: '8px 12px',
        minWidth: 140,
        boxShadow: d.highlighted
          ? '0 0 0 2px #0d948840, 0 2px 8px rgba(0,0,0,0.08)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#0d9488' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span
          style={{
            background: '#ccfbf1',
            color: '#0f766e',
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          Hook
        </span>
        {d.isAsync && (
          <span
            style={{
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: 10,
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            async
          </span>
        )}
      </div>
      <div style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>{d.label}</div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.filePath}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#0d9488' }} />
    </div>
  );
}

function FunctionNode({ data }: NodeProps) {
  const d = data as unknown as NodeData;

  return (
    <div
      style={{
        background: d.highlighted ? '#f0f9ff' : '#ffffff',
        border: `1px solid ${d.highlighted ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 120,
        boxShadow: d.highlighted
          ? '0 0 0 2px #3b82f640, 0 2px 8px rgba(0,0,0,0.08)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#9ca3af' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{d.kind}</span>
        {d.isAsync && (
          <span
            style={{
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: 10,
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            async
          </span>
        )}
      </div>
      <div style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>{d.label}</div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.filePath}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#9ca3af' }} />
    </div>
  );
}

export const nodeTypes = {
  entryPoint: EntryPointNode,
  componentNode: ComponentNode,
  hookNode: HookNode,
  functionNode: FunctionNode,
};
