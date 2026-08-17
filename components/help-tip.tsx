import { useId, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";

type HelpTipProps = {
  label: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
};

export function HelpTip({ label, children, align = "center", className = "" }: HelpTipProps) {
  const tooltipId = useId();

  return (
    <span className={`help-tip ${align} ${className}`.trim()}>
      <button
        type="button"
        className="help-tip-trigger"
        aria-label={`Explain ${label}`}
        aria-describedby={tooltipId}
      >
        <CircleHelp aria-hidden="true" size={15} />
      </button>
      <span className="help-tip-popover" id={tooltipId} role="tooltip">
        <strong>{label}</strong>
        <span>{children}</span>
      </span>
    </span>
  );
}

type HelpLabelProps = HelpTipProps & {
  as?: "span" | "strong";
};

export function HelpLabel({ label, children, align, className, as = "span" }: HelpLabelProps) {
  const Label = as;
  return (
    <span className="help-label">
      <Label>{label}</Label>
      <HelpTip label={label} align={align} className={className}>{children}</HelpTip>
    </span>
  );
}
