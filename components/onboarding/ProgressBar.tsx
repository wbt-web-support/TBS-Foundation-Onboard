export function ProgressBar({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-rail-line">
      <div
        className="h-full rounded-full bg-orange transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
