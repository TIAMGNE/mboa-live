export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-full border-2 border-ink"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ink"
      >
        <path d="M3 19l6-10 4 6 2-3 6 7" />
      </svg>
    </span>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      MBOA{' '}
      <span className="rounded-md bg-red px-1.5 py-0.5 text-bg">LIVE</span>
    </span>
  );
}
