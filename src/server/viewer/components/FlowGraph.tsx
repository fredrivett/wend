import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@xyflow/react/dist/style.css';

import { GRID_SIZE, snapCeil } from '../grid';
import type { FlowGraph as FlowGraphData, GraphNode } from '../types';
import { DocPanel } from './DocPanel';
import { FlowControls } from './FlowControls';
import { defaultLayoutOptions, type LayoutOptions, LayoutSettings } from './LayoutSettings';
import { nodeTypes } from './NodeTypes';

const elk = new ELK();

const edgeStyleByType: Record<string, React.CSSProperties> = {
  'direct-call': { stroke: '#6b7280' },
  'async-dispatch': { stroke: '#ec4899' },
  'event-emit': { stroke: '#ec4899', strokeDasharray: '4 4' },
  'http-request': { stroke: '#f97316', strokeDasharray: '8 4' },
  'conditional-call': { stroke: '#f59e0b' },
  'error-handler': { stroke: '#ef4444' },
  'middleware-chain': { stroke: '#06b6d4', strokeDasharray: '4 2' },
};

function getNodeType(node: GraphNode): string {
  if (node.entryType) return 'entryPoint';
  if (node.kind === 'component') return 'componentNode';
  if (node.kind === 'function' && /^use[A-Z]/.test(node.name)) return 'hookNode';
  return 'functionNode';
}

export type NodeCategory = string;

const entryTypeCategoryLabels: Record<string, string> = {
  'api-route': 'API Routes',
  page: 'Pages',
  'inngest-function': 'Inngest Jobs',
  'trigger-task': 'Trigger Tasks',
  middleware: 'Middleware',
  'server-action': 'Server Actions',
};

const nonEntryCategoryLabels: Record<string, string> = {
  component: 'Components',
  hook: 'Hooks',
  function: 'Functions',
};

function getNodeCategory(node: GraphNode): NodeCategory {
  if (node.entryType) return node.entryType;
  if (node.kind === 'component') return 'component';
  if (node.kind === 'function' && /^use[A-Z]/.test(node.name)) return 'hook';
  return 'function';
}

export function getCategoryLabel(category: NodeCategory): string {
  return entryTypeCategoryLabels[category] || nonEntryCategoryLabels[category] || category;
}

function toReactFlowNode(node: GraphNode): Node {
  return {
    id: node.id,
    type: getNodeType(node),
    position: { x: 0, y: 0 },
    data: {
      label: node.name,
      kind: node.kind,
      filePath: node.filePath,
      isAsync: node.isAsync,
      entryType: node.entryType,
      metadata: node.metadata,
      highlighted: true,
    },
  };
}

function toReactFlowEdges(graphEdges: FlowGraphData['edges']): Edge[] {
  return graphEdges.map((edge) => {
    const style = edgeStyleByType[edge.type] || { stroke: '#9ca3af' };
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.type === 'async-dispatch' || edge.type === 'event-emit',
      label:
        edge.type === 'direct-call' || edge.type === 'async-dispatch'
          ? undefined
          : edge.label || edge.type,
      style,
      labelStyle: { fontSize: 10, fill: '#6b7280' },
    };
  });
}

type SizeCache = Map<string, { width: number; height: number }>;

async function runElkLayout(
  currentNodes: Node[],
  graphEdges: FlowGraphData['edges'],
  layoutOptions: LayoutOptions,
  sizeCache?: SizeCache,
): Promise<Map<string, { x: number; y: number }>> {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: { ...layoutOptions },
    children: currentNodes.map((node) => {
      const cached = sizeCache?.get(node.id);
      return {
        id: node.id,
        width: snapCeil(cached?.width || node.measured?.width || 150),
        height: snapCeil(cached?.height || node.measured?.height || 60),
      };
    }),
    edges: graphEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(elkGraph);
  const positions = new Map<string, { x: number; y: number }>();
  for (const child of layout.children || []) {
    positions.set(child.id, {
      x: Math.round((child.x || 0) / GRID_SIZE) * GRID_SIZE,
      y: Math.round((child.y || 0) / GRID_SIZE) * GRID_SIZE,
    });
  }
  return positions;
}

interface FlowGraphProps {
  graph: FlowGraphData;
  onLayoutReady?: () => void;
}

function FlowGraphInner({ graph, onLayoutReady }: FlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(defaultLayoutOptions);
  const [needsLayout, setNeedsLayout] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState<Set<NodeCategory> | null>(null);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const visibleGraphRef = useRef<FlowGraphData | null>(null);
  const sizeCache = useRef<SizeCache>(new Map());

  // Shared helper: apply ELK positions to nodes and fit the view
  const applyPositionsAndFit = useCallback(
    (positions: Map<string, { x: number; y: number }>, initialNodes?: Node[]) => {
      const apply = (node: Node): Node => {
        const pos = positions.get(node.id);
        if (!pos) return node;
        const cached = sizeCache.current.get(node.id);
        return {
          ...node,
          position: pos,
          ...(cached && { width: cached.width, height: cached.height }),
        };
      };
      if (initialNodes) {
        setNodes(initialNodes.map(apply));
      } else {
        setNodes((prev) => prev.map(apply));
      }
      requestAnimationFrame(() => {
        fitView({ padding: 0.15 });
        requestAnimationFrame(() => {
          onLayoutReady?.();
        });
      });
    },
    [setNodes, fitView, onLayoutReady],
  );

  const entryPoints = useMemo(() => graph.nodes.filter((n) => n.entryType), [graph.nodes]);

  // Compute available categories and their counts
  const availableTypes = useMemo(() => {
    const counts = new Map<NodeCategory, number>();
    for (const node of graph.nodes) {
      const cat = getNodeCategory(node);
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return counts;
  }, [graph.nodes]);

  const onToggleType = useCallback(
    (category: NodeCategory) => {
      setEnabledTypes((prev) => {
        // If null (all enabled), start with all enabled minus the toggled one
        if (!prev) {
          const all = new Set(availableTypes.keys());
          all.delete(category);
          return all;
        }
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }
        // If all are enabled, go back to null
        if (next.size === availableTypes.size) return null;
        return next;
      });
    },
    [availableTypes],
  );

  // Compute connected nodes: trace callers upward and callees downward separately
  const highlightedIds = useMemo(() => {
    if (!selectedEntry) return null;
    const connected = new Set<string>([selectedEntry]);

    const downQueue = [selectedEntry];
    while (downQueue.length > 0) {
      const current = downQueue.shift() as string;
      for (const edge of graph.edges) {
        if (edge.source === current && !connected.has(edge.target)) {
          connected.add(edge.target);
          downQueue.push(edge.target);
        }
      }
    }

    const upQueue = [selectedEntry];
    while (upQueue.length > 0) {
      const current = upQueue.shift() as string;
      for (const edge of graph.edges) {
        if (edge.target === current && !connected.has(edge.source)) {
          connected.add(edge.source);
          upQueue.push(edge.source);
        }
      }
    }

    return connected;
  }, [selectedEntry, graph.edges]);

  // Apply type and search filters
  const filteredGraph = useMemo(() => {
    let filtered = graph;

    // Type filter
    if (enabledTypes) {
      const typeMatchIds = new Set(
        filtered.nodes.filter((n) => enabledTypes.has(getNodeCategory(n))).map((n) => n.id),
      );
      filtered = {
        ...filtered,
        nodes: filtered.nodes.filter((n) => typeMatchIds.has(n.id)),
        edges: filtered.edges.filter(
          (e) => typeMatchIds.has(e.source) && typeMatchIds.has(e.target),
        ),
      };
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchingIds = new Set(
        filtered.nodes
          .filter(
            (n) =>
              n.name.toLowerCase().includes(q) ||
              n.filePath.toLowerCase().includes(q) ||
              n.metadata?.route?.toLowerCase().includes(q) ||
              n.metadata?.eventTrigger?.toLowerCase().includes(q) ||
              n.metadata?.taskId?.toLowerCase().includes(q),
          )
          .map((n) => n.id),
      );
      filtered = {
        ...filtered,
        nodes: filtered.nodes.filter((n) => matchingIds.has(n.id)),
        edges: filtered.edges.filter((e) => matchingIds.has(e.source) && matchingIds.has(e.target)),
      };
    }

    return filtered;
  }, [graph, searchQuery, enabledTypes]);

  // Filter to only highlighted nodes
  const visibleGraph = useMemo(() => {
    if (!highlightedIds) return filteredGraph;
    return {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter((n) => highlightedIds.has(n.id)),
      edges: filteredGraph.edges.filter(
        (e) => highlightedIds.has(e.source) && highlightedIds.has(e.target),
      ),
    };
  }, [filteredGraph, highlightedIds]);

  // When visibleGraph changes: use cached sizes for instant layout, or fall back to two-pass measurement
  useEffect(() => {
    visibleGraphRef.current = visibleGraph;
    const rfNodes = visibleGraph.nodes.map((n) => {
      const rfNode = toReactFlowNode(n);
      if (selectedEntry) {
        rfNode.data = { ...rfNode.data, dimmed: n.id !== selectedEntry };
      }
      return rfNode;
    });
    setEdges(toReactFlowEdges(visibleGraph.edges));

    const allCached = visibleGraph.nodes.every((n) => sizeCache.current.has(n.id));
    if (allCached && visibleGraph.nodes.length > 0) {
      // Fast path: compute positions before rendering so nodes never appear at origin
      runElkLayout(rfNodes, visibleGraph.edges, layoutOptions, sizeCache.current).then(
        (positions) => applyPositionsAndFit(positions, rfNodes),
      );
    } else {
      // Slow path: render at origin so React Flow can measure, then layout in Pass 2
      setNodes(rfNodes);
      setNeedsLayout(true);
    }
  }, [visibleGraph, setNodes, setEdges, layoutOptions, applyPositionsAndFit, selectedEntry]);

  // Pass 2: once nodes are measured, cache sizes and run ELK with real dimensions
  useEffect(() => {
    if (!needsLayout || !nodesInitialized || !visibleGraphRef.current) return;
    setNeedsLayout(false);

    // Cache measured sizes for future fast-path layouts
    for (const node of nodes) {
      if (node.measured?.width && node.measured?.height) {
        sizeCache.current.set(node.id, {
          width: snapCeil(node.measured.width),
          height: snapCeil(node.measured.height),
        });
      }
    }

    const currentGraph = visibleGraphRef.current;
    runElkLayout(nodes, currentGraph.edges, layoutOptions, sizeCache.current).then((positions) =>
      applyPositionsAndFit(positions),
    );
  }, [needsLayout, nodesInitialized, nodes, layoutOptions, applyPositionsAndFit]);

  // Re-layout when layout options change (without re-measuring)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-run on layoutOptions change
  useEffect(() => {
    if (!visibleGraphRef.current || needsLayout) return;
    runElkLayout(nodes, visibleGraphRef.current.edges, layoutOptions, sizeCache.current).then(
      (positions) => applyPositionsAndFit(positions),
    );
  }, [layoutOptions]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graph.nodes.find((n) => n.id === node.id);
      if (!graphNode) return;

      setSelectedEntry((prev) => (prev === node.id ? null : node.id));
    },
    [graph.nodes],
  );

  return (
    <div className="w-full h-full flex">
      <FlowControls
        entryPoints={entryPoints}
        selectedEntry={selectedEntry}
        onSelectEntry={setSelectedEntry}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        nodeCount={visibleGraph.nodes.length}
        edgeCount={visibleGraph.edges.length}
        availableTypes={availableTypes}
        enabledTypes={enabledTypes}
        onToggleType={onToggleType}
        onSoloType={(category) => setEnabledTypes(new Set([category]))}
        onResetTypes={() => setEnabledTypes(null)}
      />
      <div className="flex-1 relative">
        <LayoutSettings options={layoutOptions} onChange={setLayoutOptions} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          snapToGrid
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
        >
          <Background variant={BackgroundVariant.Dots} color="#d1d5db" gap={GRID_SIZE} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-right"
            style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>
        <DocPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>
    </div>
  );
}

export function FlowGraph({ graph, onLayoutReady }: FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner graph={graph} onLayoutReady={onLayoutReady} />
    </ReactFlowProvider>
  );
}
