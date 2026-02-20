import { useCallback, useEffect, useState } from 'react';
import type { FlowGraph as FlowGraphData } from '../../graph/types.js';
import { FlowGraph } from './components/FlowGraph';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  const [graph, setGraph] = useState<FlowGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [layoutReady, setLayoutReady] = useState(false);

  const onLayoutReady = useCallback(() => {
    setLayoutReady(true);
  }, []);

  useEffect(() => {
    fetch('/api/graph')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load graph: ${res.status}`);
        return res.json();
      })
      .then((data: FlowGraphData) => {
        setGraph(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full font-sans text-red-500 gap-2">
        <div className="font-semibold">Error loading graph</div>
        <div className="text-gray-500 text-sm">{error}</div>
        <div className="text-gray-400 text-[13px] mt-2">
          Make sure you've run <code className="bg-gray-100 px-1.5 rounded">syncdocs graph</code>{' '}
          first.
        </div>
      </div>
    );
  }

  if (!loading && (!graph || graph.nodes.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full font-sans text-gray-500 gap-2">
        <div className="font-semibold text-base">No graph data</div>
        <div className="text-sm">
          Run <code className="bg-gray-100 px-1.5 rounded">syncdocs graph</code> to build the
          project call graph.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {!layoutReady && (
        <div className="absolute inset-0 z-20 bg-white">
          <LoadingSpinner />
        </div>
      )}
      {graph && <FlowGraph graph={graph} onLayoutReady={onLayoutReady} />}
    </div>
  );
}
