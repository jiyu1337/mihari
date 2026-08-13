import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

type SiteHeaderProps = {
  mode?: "paper" | "dark";
};

export function SiteHeader({ mode = "paper" }: SiteHeaderProps) {
  return (
    <header className={`site-header ${mode === "dark" ? "site-header-dark" : ""}`}>
      <Link className="wordmark" href="/" aria-label="MIHARI home">
        <BrandMark className="wordmark-symbol" inverted={mode === "dark"} />
        <span>MIHARI</span>
        <span className="wordmark-jp mono">見張り</span>
      </Link>
      <div className="header-status mono">
        <span className="status-pulse" aria-hidden="true" />
        RH CHAIN / 4663
      </div>
      <nav className="main-nav" aria-label="Primary navigation">
        <Link href="/#system">System</Link>
        <Link href="/#protocol">Protocol</Link>
        <Link href="/docs">Docs</Link>
        <Link className="nav-launch" href="/launch">
          Launch app <ArrowUpRight size={15} strokeWidth={1.8} />
        </Link>
      </nav>
    </header>
  );
}
