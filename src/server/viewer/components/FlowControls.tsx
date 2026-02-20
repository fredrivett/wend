import type { ChangeEvent } from 'react';
import type { GraphNode } from '../../../graph/types.js';
import { getCategoryLabel, type NodeCategory } from './FlowGraph';

interface FlowControlsProps {
  entryPoints: GraphNode[];
  selectedEntry: string | null;
  onSelectEntry: (nodeId: string | null) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  nodeCount: number;
  edgeCount: number;
  availableTypes: Map<NodeCategory, number>;
  enabledTypes: Set<NodeCategory> | null;
  onToggleType: (category: NodeCategory) => void;
  onSoloType: (category: NodeCategory) => void;
  onResetTypes: () => void;
  showConditionals: boolean;
  onToggleConditionals: () => void;
  hasConditionalEdges: boolean;
}

export function FlowControls({
  entryPoints,
  selectedEntry,
  onSelectEntry,
  searchQuery,
  onSearch,
  nodeCount,
  edgeCount,
  availableTypes,
  enabledTypes,
  onToggleType,
  onSoloType,
  onResetTypes,
  showConditionals,
  onToggleConditionals,
  hasConditionalEdges,
}: FlowControlsProps) {
  const entryTypeLabels: Record<string, string> = {
    'api-route': 'API',
    page: 'Page',
    'inngest-function': 'Inngest',
    'trigger-task': 'Trigger',
    middleware: 'MW',
    'server-action': 'Action',
  };

  return (
    <div className="bg-white border-r border-gray-200 p-4 w-[280px] min-w-[280px] h-full overflow-auto">
      <div className="font-bold text-sm mb-3 text-gray-900">Syncdocs Flow Graph</div>

      <input
        type="text"
        placeholder="Search nodes..."
        value={searchQuery}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
        className="w-full px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none mb-3"
      />

      <div className="text-[11px] text-gray-500 mb-3">
        {nodeCount} nodes, {edgeCount} edges
      </div>

      {availableTypes.size > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <span>Node Types</span>
            {enabledTypes && (
              <button
                type="button"
                onClick={onResetTypes}
                className="bg-transparent border-none p-0 text-[11px] text-gray-400 cursor-pointer font-normal"
              >
                reset
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {Array.from(availableTypes.entries()).map(([category, count]) => {
              const checked = !enabledTypes || enabledTypes.has(category);
              return (
                <div
                  key={category}
                  className="group flex items-center gap-1.5 text-xs text-gray-700"
                >
                  <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleType(category)}
                      className="m-0 shrink-0"
                    />
                    <span>{getCategoryLabel(category)}</span>
                    <span className="text-gray-400 text-[11px]">({count})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onSoloType(category)}
                    className="bg-transparent border-none px-0.5 py-0 text-[11px] text-gray-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                  >
                    only
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasConditionalEdges && (
        <div className="mb-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showConditionals}
              onChange={onToggleConditionals}
              className="m-0 shrink-0"
            />
            <span>Show conditionals</span>
          </label>
        </div>
      )}

      {entryPoints.length > 0 && (
        <>
          <div className="text-xs font-semibold text-gray-700 mb-1.5">Entry Points</div>
          <div className="flex flex-col gap-1">
            {selectedEntry && (
              <button
                type="button"
                onClick={() => onSelectEntry(null)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-md bg-gray-50 cursor-pointer text-xs text-left text-gray-500"
              >
                Show all nodes
              </button>
            )}
            {entryPoints.map((ep) => {
              const isSelected = selectedEntry === ep.id;
              const typeLabel = ep.entryType ? entryTypeLabels[ep.entryType] || ep.entryType : '';
              const detail = ep.metadata?.httpMethod
                ? `${ep.metadata.httpMethod} ${ep.metadata.route || ''}`
                : ep.metadata?.eventTrigger || ep.metadata?.taskId || '';

              return (
                <button
                  type="button"
                  key={ep.id}
                  onClick={() => onSelectEntry(isSelected ? null : ep.id)}
                  className={`px-2.5 py-1.5 border rounded-md cursor-pointer text-xs text-left transition-all duration-150 overflow-hidden w-full ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {typeLabel && <span className="font-semibold text-gray-500">{typeLabel}</span>}
                    <span className="font-medium text-gray-800">{ep.name}</span>
                  </div>
                  {detail && (
                    <div className="text-[11px] text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
                      {detail}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
