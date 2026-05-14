/** Inline wordmark + mark (no external asset). Matches WBT teal / slate palette. */
export function WbtLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 36"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="We Build Trades"
    >
      <title>We Build Trades</title>
      <path fill="#14b8a6" d="M2 28 18 12 34 20 18 28z" />
      <path fill="#0d9488" d="M10 30 26 14 42 22 26 30z" opacity={0.88} />
      <path fill="#115e59" d="M6 30 14 22 22 26 14 30z" opacity={0.35} />
      <text x="50" y="25" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="15" fontWeight="700" fill="#0f172a">
        We{" "}
      </text>
      <text x="76" y="25" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="15" fontWeight="700" fill="#14b8a6">
        Build{" "}
      </text>
      <text x="118" y="25" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="15" fontWeight="700" fill="#0f172a">
        Trades
      </text>
    </svg>
  );
}
