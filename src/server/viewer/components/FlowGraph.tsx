import {
  Background,
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
import type { FlowGraph as FlowGraphData, GraphNode } from '../types';
import { DocPanel } from './DocPanel';
import { FlowControls } from './FlowControls';
import { type LayoutOptions, LayoutSettings, defaultLayoutOptions } from './LayoutSettings';
import { nodeTypes } from './NodeTypes';

const elk = new ELK();

const edgeStyleByType: Record<string, React.CSSProperties> = {
  'direct-call': { stroke: '#6b7280' },
  'async-dispatch': { stroke: '#ec4899', strokeDasharray: '3 6' },
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
      animated: edge.isAsync,
      label: edge.label || (edge.type !== 'direct-call' ? edge.type : undefined),
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
        width: cached?.width || node.measured?.width || 150,
        height: cached?.height || node.measured?.height || 60,
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
    positions.set(child.id, { x: child.x || 0, y: child.y || 0 });
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
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const visibleGraphRef = useRef<FlowGraphData | null>(null);
  const sizeCache = useRef<SizeCache>(new Map());

  const entryPoints = useMemo(() => graph.nodes.filter((n) => n.entryType), [graph.nodes]);

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

  // Apply search filter
  const filteredGraph = useMemo(() => {
    if (!searchQuery.trim()) return graph;
    const q = searchQuery.toLowerCase();
    const matchingIds = new Set(
      graph.nodes
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
    return {
      ...graph,
      nodes: graph.nodes.filter((n) => matchingIds.has(n.id)),
      edges: graph.edges.filter((e) => matchingIds.has(e.source) && matchingIds.has(e.target)),
    };
  }, [graph, searchQuery]);

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
    const rfNodes = visibleGraph.nodes.map(toReactFlowNode);
    setEdges(toReactFlowEdges(visibleGraph.edges));

    const allCached = visibleGraph.nodes.every((n) => sizeCache.current.has(n.id));
    if (allCached && visibleGraph.nodes.length > 0) {
      // Fast path: compute positions before rendering so nodes never appear at origin
      runElkLayout(rfNodes, visibleGraph.edges, layoutOptions, sizeCache.current).then(
        (positions) => {
          const positioned = rfNodes.map((node) => {
            const pos = positions.get(node.id);
            return pos ? { ...node, position: pos } : node;
          });
          setNodes(positioned);
          requestAnimationFrame(() => {
            fitView({ padding: 0.15 });
            requestAnimationFrame(() => {
              onLayoutReady?.();
            });
          });
        },
      );
    } else {
      // Slow path: render at origin so React Flow can measure, then layout in Pass 2
      setNodes(rfNodes);
      setNeedsLayout(true);
    }
  }, [visibleGraph, setNodes, setEdges, layoutOptions, fitView, onLayoutReady]);

  // Pass 2: once nodes are measured, cache sizes and run ELK with real dimensions
  useEffect(() => {
    if (!needsLayout || !nodesInitialized || !visibleGraphRef.current) return;
    setNeedsLayout(false);

    // Cache measured sizes for future fast-path layouts
    for (const node of nodes) {
      if (node.measured?.width && node.measured?.height) {
        sizeCache.current.set(node.id, { width: node.measured.width, height: node.measured.height });
      }
    }

    const currentGraph = visibleGraphRef.current;
    runElkLayout(nodes, currentGraph.edges, layoutOptions, sizeCache.current).then((positions) => {
      setNodes((prev) =>
        prev.map((node) => {
          const pos = positions.get(node.id);
          return pos ? { ...node, position: pos } : node;
        }),
      );
      requestAnimationFrame(() => {
        fitView({ padding: 0.15 });
        requestAnimationFrame(() => {
          onLayoutReady?.();
        });
      });
    });
  }, [needsLayout, nodesInitialized, nodes, layoutOptions, setNodes, fitView]);

  // Re-layout when layout options change (without re-measuring)
  useEffect(() => {
    if (!visibleGraphRef.current || needsLayout) return;
    runElkLayout(nodes, visibleGraphRef.current.edges, layoutOptions, sizeCache.current).then((positions) => {
      setNodes((prev) =>
        prev.map((node) => {
          const pos = positions.get(node.id);
          return pos ? { ...node, position: pos } : node;
        }),
      );
      requestAnimationFrame(() => {
        fitView({ padding: 0.15 });
        requestAnimationFrame(() => {
          onLayoutReady?.();
        });
      });
    });
    // Only re-run when layoutOptions change, not on every nodes change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutOptions]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graph.nodes.find((n) => n.id === node.id);
      if (!graphNode) return;

      setSelectedNode((prev) => (prev?.id === graphNode.id ? null : graphNode));
      setSelectedEntry((prev) => (prev === node.id ? null : node.id));
    },
    [graph.nodes],
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <FlowControls
        entryPoints={entryPoints}
        selectedEntry={selectedEntry}
        onSelectEntry={setSelectedEntry}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        nodeCount={visibleGraph.nodes.length}
        edgeCount={visibleGraph.edges.length}
      />
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
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#f3f4f6" gap={20} />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-right"
          style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
      <DocPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
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
