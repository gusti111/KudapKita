export function LoadingScreen({ label = 'Memuat…' }: { label?: string }) {
  return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-terracotta" />{label}</div>;
}
