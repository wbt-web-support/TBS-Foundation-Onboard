/** Small stacked-mark only (for checklist rows, etc.). */
export function WbtMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path fill="#14b8a6" d="M0 24 14 10 28 17 14 24z" />
      <path fill="#0d9488" d="M6 26 20 12 34 19 20 26z" opacity={0.88} />
      <path fill="#115e59" d="M2 26 10 18 18 22 10 26z" opacity={0.35} />
    </svg>
  );
}
