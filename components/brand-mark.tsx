import { clsx } from "clsx";

type BrandMarkProps = {
  className?: string;
  inverted?: boolean;
};

export function BrandMark({ className, inverted = false }: BrandMarkProps) {
  const ink = inverted ? "var(--paper)" : "var(--ink)";

  return (
    <svg
      aria-label="MIHARI signal crest"
      className={clsx("brand-mark", className)}
      viewBox="0 0 100 100"
      role="img"
    >
      <path d="M7 7H44V34L32 24H23V45H7V7Z" fill={ink} />
      <path d="M56 7H93V45H77V24H68L56 34V7Z" fill={ink} />
      <path d="M7 56H23V77H44V93H7V56Z" fill={ink} />
      <path d="M77 56H93V93H56V77H77V56Z" fill={ink} />
      <rect x="58" y="55" width="6" height="6" fill="var(--neon)" />
    </svg>
  );
}
