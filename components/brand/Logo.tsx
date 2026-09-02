// The Abode mark: a geometric "A" whose double crossbar nods to the ₹ symbol,
// in the honey-gold brand gradient. Bare (no tile) so it sits on the app's dark
// surfaces; the favicon / app-icon add their own tile. userSpaceOnUse gradient
// so the horizontal crossbars paint at every size (a bbox gradient drops them).
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
        <path d="M27 79 L48 19 L69 79" />
        <path strokeWidth="9" d="M33 46 L66 46" />
        <path strokeWidth="9" d="M32 62 L61 62" />
      </g>
    </svg>
  );
}
