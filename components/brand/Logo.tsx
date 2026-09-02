// The Abode mark: a clean upward "A" / ascent arrow in the honey-gold brand
// gradient. Bare (no tile) so it sits on the app's dark surfaces; the favicon /
// app-icon add their own tile.
export default function Logo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label="Abode"
    >
      <defs>
        <linearGradient id="abodeMark" gradientUnits="userSpaceOnUse" x1="20" y1="16" x2="76" y2="82">
          <stop offset="0" stopColor="#E7C67E" />
          <stop offset="1" stopColor="#CFA24A" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#abodeMark)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 78 L48 21 L70 78" />
      </g>
    </svg>
  );
}
