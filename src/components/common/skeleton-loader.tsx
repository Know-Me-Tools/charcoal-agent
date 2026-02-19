interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-muted ${className}`}
    />
  );
}

export function SkeletonLine({ width = "w-full" }: { width?: string }) {
  return <SkeletonBlock className={`h-4 ${width}`} />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <SkeletonLine width="w-2/3" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-1/2" />
    </div>
  );
}
