import { clsx } from "clsx";

type BrandMarkProps = {
  className?: string;
  inverted?: boolean;
};

export function BrandMark({ className, inverted = false }: BrandMarkProps) {
  const ink = inverted ? "var(--neon)" : "var(--ink)";

  return (
    <svg
      aria-label="MIHARI signal crest"
      className={clsx("brand-mark", className)}
      viewBox="0 0 48 48"
      role="img"
    >
      <path d="M8 9h13v4H12v9H8V9Z" fill={ink} />
      <path d="M40 39H27v-4h9v-9h4v13Z" fill={ink} />
      <path d="M40 9v13h-4v-9h-9V9h13Z" fill={ink} opacity="0.42" />
      <path d="M8 39V26h4v9h9v4H8Z" fill={ink} opacity="0.42" />
      <rect x="20" y="20" width="8" height="8" fill="var(--neon)" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}
