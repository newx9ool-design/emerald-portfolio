export function Loading({ message = '読み込み中...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-brand-600 text-sm">{message}</p>
      </div>
    </div>
  );
}
