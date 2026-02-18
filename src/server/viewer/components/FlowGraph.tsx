import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '@xyflow/react/dist/style.css';
import type { FlowGraph as FlowGraphData, GraphNode } from '../types';
import { DocPanel } from './DocPanel';
import { FlowControls } from './FlowControls';
import { nodeTypes } from './NodeTypes';

const elk = new ELK();

const edgeStyleByType: Record<string, React.CSSProperties> = {
  'direct-call': { stroke: '#6b7280' },
  'async-dispatch': { stroke: '#3b82f6', strokeDasharray: '6 3' },
  'event-emit': { stroke: '#ec4899', strokeDasharray: '4 4' },
  'http-request': { stroke: '#f97316', strokeDasharray: '8 4' },
  'conditional-call': { stroke: '#f59e0b' },
  'error-handler': { stroke: '#ef4444' },
  'middleware-chain': { stroke: '#06b6d4', strokeDasharray: '4 2' },
};

async function layoutGraph(graphData: FlowGraphData, highlightedIds: Set<string> | null) {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: graphData.nodes.map((node) => ({
      id: node.id,
      width: node.entryType ? 200 : 160,
      height: node.entryType ? 90 : 70,
    })),
    edges: graphData.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(elkGraph);

  const nodeMap = new Map(graphData.nodes.map((n) => [n.id, n]));
  const nodes: Node[] = (layout.children || [])
    .map((elkNode) => {
      const graphNode = nodeMap.get(elkNode.id);
      if (!graphNode) return null;
      const isHighlighted = highlightedIds ? highlightedIds.has(graphNode.id) : false;

      return {
        id: graphNode.id,
        type: graphNode.entryType ? 'entryPoint' : 'functionNode',
        position: { x: elkNode.x || 0, y: elkNode.y || 0 },
        data: {
          label: graphNode.name,
          kind: graphNode.kind,
          filePath: graphNode.filePath,
          isAsync: graphNode.isAsync,
          entryType: graphNode.entryType,
          metadata: graphNode.metadata,
          highlighted: isHighlighted,
        },
        hidden: highlightedIds ? !highlightedIds.has(graphNode.id) : false,
      };
    })
    .filter((n): n is Node => n !== null);

  const edges: Edge[] = graphData.edges.map((edge) => {
    const style = edgeStyleByType[edge.type] || { stroke: '#9ca3af' };
    const hidden = highlightedIds
      ? !highlightedIds.has(edge.source) || !highlightedIds.has(edge.target)
      : false;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.isAsync,
      label: edge.label || (edge.type !== 'direct-call' ? edge.type : undefined),
      style,
      hidden,
      labelStyle: { fontSize: 10, fill: '#6b7280' },
    };
  });

  return { nodes, edges };
}

interface FlowGraphProps {
  graph: FlowGraphData;
}

export function FlowGraph({ graph }: FlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const entryPoints = useMemo(() => graph.nodes.filter((n) => n.entryType), [graph.nodes]);

  // Compute reachable nodes from selected entry point
  const highlightedIds = useMemo(() => {
    if (!selectedEntry) return null;
    const reachable = new Set<string>();
    const queue = [selectedEntry];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (reachable.has(current)) continue;
      reachable.add(current);
      for (const edge of graph.edges) {
        if (edge.source === current && !reachable.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }
    return reachable;
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

  useEffect(() => {
    layoutGraph(filteredGraph, highlightedIds).then(({ nodes: n, edges: e }) => {
      setNodes(n);
      setEdges(e);
    });
  }, [filteredGraph, highlightedIds, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graph.nodes.find((n) => n.id === node.id);
      if (!graphNode) return;

      // Toggle doc panel for any node
      setSelectedNode((prev) => (prev?.id === graphNode.id ? null : graphNode));

      // Entry points also toggle flow highlighting
      if (graphNode.entryType) {
        setSelectedEntry((prev) => (prev === node.id ? null : node.id));
      }
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
        nodeCount={filteredGraph.nodes.length}
        edgeCount={filteredGraph.edges.length}
      />
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
          position="bottom-left"
          style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
      <DocPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
