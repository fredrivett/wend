export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full font-sans text-gray-500 gap-3">
      <div className="w-6 h-6 border-[2.5px] border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      <div className="text-sm">Loading...</div>
    </div>
  );
}
