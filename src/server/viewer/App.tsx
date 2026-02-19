import { useCallback, useEffect, useState } from 'react';
import { FlowGraph } from './components/FlowGraph';
import { LoadingSpinner } from './components/LoadingSpinner';
import type { FlowGraph as FlowGraphData } from './types';

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: '#ef4444',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600 }}>Error loading graph</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{error}</div>
        <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
          Make sure you've run{' '}
          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
            syncdocs graph
          </code>{' '}
          first.
        </div>
      </div>
    );
  }

  if (!loading && (!graph || graph.nodes.length === 0)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: '#6b7280',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 16 }}>No graph data</div>
        <div style={{ fontSize: 14 }}>
          Run{' '}
          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
            syncdocs graph
          </code>{' '}
          to build the project call graph.
        </div>
      </div>
    );
  }

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
      {graph && <FlowGraph graph={graph} onLayoutReady={onLayoutReady} />}
    </div>
  );
}
