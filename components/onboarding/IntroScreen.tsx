export function IntroScreen({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{heading}</h2>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
