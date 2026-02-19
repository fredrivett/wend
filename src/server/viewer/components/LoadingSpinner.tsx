const spinnerKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

export function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        color: '#6b7280',
        gap: 12,
      }}
    >
      <style>{spinnerKeyframes}</style>
      <div
        style={{
          width: 24,
          height: 24,
          border: '2.5px solid #e5e7eb',
          borderTopColor: '#6b7280',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ fontSize: 14 }}>Loading...</div>
    </div>
  );
}
