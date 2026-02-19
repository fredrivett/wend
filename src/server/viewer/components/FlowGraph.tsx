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
import { LoadingSpinner } from './LoadingSpinner';
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

async function runElkLayout(
  currentNodes: Node[],
  graphEdges: FlowGraphData['edges'],
  layoutOptions: LayoutOptions,
): Promise<Map<string, { x: number; y: number }>> {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: { ...layoutOptions },
    children: currentNodes.map((node) => ({
      id: node.id,
      width: node.measured?.width || 150,
      height: node.measured?.height || 60,
    })),
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
}

function FlowGraphInner({ graph }: FlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(defaultLayoutOptions);
  const [needsLayout, setNeedsLayout] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const visibleGraphRef = useRef<FlowGraphData | null>(null);

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

  // Pass 1: when visibleGraph changes, render nodes at origin so React Flow can measure them
  useEffect(() => {
    visibleGraphRef.current = visibleGraph;
    setLayoutReady(false);
    setNodes(visibleGraph.nodes.map(toReactFlowNode));
    setEdges(toReactFlowEdges(visibleGraph.edges));
    setNeedsLayout(true);
  }, [visibleGraph, setNodes, setEdges]);

  // Pass 2: once nodes are measured, run ELK with real dimensions and apply positions
  useEffect(() => {
    if (!needsLayout || !nodesInitialized || !visibleGraphRef.current) return;
    setNeedsLayout(false);

    const currentGraph = visibleGraphRef.current;
    runElkLayout(nodes, currentGraph.edges, layoutOptions).then((positions) => {
      setNodes((prev) =>
        prev.map((node) => {
          const pos = positions.get(node.id);
          return pos ? { ...node, position: pos } : node;
        }),
      );
      requestAnimationFrame(() => {
        fitView({ padding: 0.15 });
        requestAnimationFrame(() => {
          setLayoutReady(true);
        });
      });
    });
  }, [needsLayout, nodesInitialized, nodes, layoutOptions, setNodes, fitView]);

  // Re-layout when layout options change (without re-measuring)
  useEffect(() => {
    if (!visibleGraphRef.current || needsLayout) return;
    runElkLayout(nodes, visibleGraphRef.current.edges, layoutOptions).then((positions) => {
      setNodes((prev) =>
        prev.map((node) => {
          const pos = positions.get(node.id);
          return pos ? { ...node, position: pos } : node;
        }),
      );
      requestAnimationFrame(() => {
        fitView({ padding: 0.15 });
        requestAnimationFrame(() => {
          setLayoutReady(true);
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
      {!layoutReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: '#ffffff',
          }}
        >
          <LoadingSpinner />
        </div>
      )}
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

export function FlowGraph({ graph }: FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner graph={graph} />
    </ReactFlowProvider>
  );
}
