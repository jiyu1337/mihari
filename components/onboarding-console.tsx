"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Search, Wallet } from "lucide-react";
import { HelpLabel } from "@/components/help-tip";
import { helpCopy } from "@/lib/help-content";
import { PUBLIC_WATCHLIST_ASSETS } from "@/lib/product-limits";
import type { RobinhoodAsset } from "@/lib/robinhood";

const fallbackAssets = [
  { tokenSymbol: "AAPL", tokenName: "Apple • Robinhood Token" },
  { tokenSymbol: "NVDA", tokenName: "NVIDIA • Robinhood Token" },
  { tokenSymbol: "TSLA", tokenName: "Tesla • Robinhood Token" },
  { tokenSymbol: "AMZN", tokenName: "Amazon • Robinhood Token" },
  { tokenSymbol: "MSFT", tokenName: "Microsoft • Robinhood Token" },
  { tokenSymbol: "SPY", tokenName: "SPDR S&P 500 ETF Trust • Robinhood Token" },
] as RobinhoodAsset[];

const modes = [
  {
    id: "observe",
    label: "OBSERVE",
    jp: "観察",
    price: "LIVE · FREE",
    description: "Live Robinhood data, AI explanations and event monitoring. No transaction permissions.",
  },
  {
    id: "guard",
    label: "GUARD",
    jp: "保護",
    price: "COMING NEXT",
    description: "Prepare policy actions and request approval before onchain execution.",
  },
  {
    id: "automate",
    label: "AUTOMATE",
    jp: "自動",
    price: "COMING NEXT",
    description: "Bounded automatic actions for vaults, lending and agent strategies.",
  },
];

function cleanAssetName(name: string) {
  return name.replace(" • Robinhood Token", "");
}

export function OnboardingConsole() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState(["NVDA", "AAPL", "TSLA"]);
  const [assetCatalog, setAssetCatalog] = useState<RobinhoodAsset[]>(fallbackAssets);
  const [catalogMode, setCatalogMode] = useState<"loading" | "live" | "fallback">("loading");
  const [assetSearch, setAssetSearch] = useState("");
  const [mode, setMode] = useState("observe");

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const saved = JSON.parse(window.localStorage.getItem("mihari:configuration") ?? "{}") as {
        assets?: string[];
      };
      restoreTimer = window.setTimeout(() => {
        if (saved.assets?.length) setSelectedAssets(saved.assets.slice(0, PUBLIC_WATCHLIST_ASSETS));
      }, 0);
    } catch {
      // A malformed local preference should never block onboarding.
    }

    const controller = new AbortController();
    void fetch("/api/assets", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Asset catalog unavailable");
        return response.json() as Promise<{ assets: RobinhoodAsset[] }>;
      })
      .then((result) => {
        if (result.assets.length) {
          setAssetCatalog(result.assets);
          setCatalogMode("live");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalogMode("fallback");
      });

    return () => {
      controller.abort();
      if (restoreTimer !== undefined) window.clearTimeout(restoreTimer);
    };
  }, []);

  const selectedMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);
  const visibleAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return assetCatalog;
    return assetCatalog.filter((asset) =>
      `${asset.tokenSymbol} ${asset.tokenName}`.toLowerCase().includes(query),
    );
  }, [assetCatalog, assetSearch]);
  const selectedAssetSet = useMemo(() => new Set(selectedAssets), [selectedAssets]);
  const allAssetsSelected = useMemo(
    () => selectedAssets.length >= Math.min(PUBLIC_WATCHLIST_ASSETS, assetCatalog.length),
    [assetCatalog.length, selectedAssets.length],
  );

  function toggleAsset(symbol: string) {
    setSelectedAssets((current) => {
      if (current.includes(symbol)) return current.filter((item) => item !== symbol);
      if (current.length >= PUBLIC_WATCHLIST_ASSETS) return current;
      return [...current, symbol];
    });
  }

  function selectAllAssets() {
    setSelectedAssets([...new Set(visibleAssets.slice(0, PUBLIC_WATCHLIST_ASSETS).map((asset) => asset.tokenSymbol))]);
  }

  function clearSelectedAssets() {
    setSelectedAssets([]);
  }

  async function completeSetup() {
    window.localStorage.setItem("mihari:configuration", JSON.stringify({
      assets: selectedAssets,
      mode,
      createdAt: new Date().toISOString(),
    }));
    const profileResponse = await fetch("/api/profile", { cache: "no-store" }).catch(() => null);
    if (profileResponse?.ok) {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: selectedAssets, mode }),
      }).catch(() => undefined);
    }
    router.push("/app");
  }

  return (
    <div className="onboarding-console">
      <aside className="onboarding-rail">
        <p className="mono">CONFIGURATION RECORD</p>
        <strong className="mono">0{step}</strong>
        <ol className="mono">
          <li className={step >= 1 ? "active" : ""}>01 / IDENTITY</li>
          <li className={step >= 2 ? "active" : ""}>02 / ASSETS</li>
          <li className={step >= 3 ? "active" : ""}>03 / POLICY</li>
        </ol>
        <p className="mono">見張り / SETUP</p>
      </aside>

      <section className="onboarding-workspace">
        {step === 1 && (
          <div className="setup-panel compact-setup">
            <div className="setup-heading">
              <p className="section-kicker mono">01 / IDENTITY LAYER</p>
              <h1>Choose your access.</h1>
              <p>
                Create a personal profile with email or a wallet signature, or enter the public
                monitor without an account. Wallet access never asks for transaction approval.
              </p>
              <div className="setup-quick-help mono">
                <HelpLabel label="EMAIL PROFILE">Sign in with email and password, then add verified wallets.</HelpLabel>
                <HelpLabel label="WALLET PROFILE">A free message signature creates or opens the profile. No gas or transaction.</HelpLabel>
                <HelpLabel label="PUBLIC MODE" align="end">No account. Monitor up to three assets in read-only mode.</HelpLabel>
              </div>
            </div>
            <div className="identity-options">
              <Link className="identity-choice" href="/sign-in">
                <span className="choice-index mono">A-01 / EMAIL ACCESS</span>
                <span className="choice-status mono">PROFILE</span>
                <Mail size={28} strokeWidth={1.4} />
                <strong>Continue with email</strong>
                <small>Sign in or create a profile, then link wallets and save your monitoring scope</small>
                <ArrowRight size={18} />
              </Link>
              <Link className="identity-choice" href="/map">
                <span className="choice-index mono">A-02 / WALLET ACCESS</span>
                <span className="choice-status mono">PROFILE</span>
                <Wallet size={28} strokeWidth={1.4} />
                <strong>Continue with wallet</strong>
                <small>Create or open your MIHARI profile with a free message signature</small>
                <ArrowRight size={18} />
              </Link>
              <button className="identity-choice" onClick={() => setStep(2)}>
                <span className="choice-index mono">A-03 / PUBLIC ACCESS</span>
                <span className="choice-status mono">3 ASSETS</span>
                <span className="readonly-glyph mono">R/O</span>
                <strong>Continue read-only</strong>
                <small>No funds, signature or transaction permissions</small>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-panel asset-setup-panel">
            <div className="setup-heading asset-setup-heading">
              <div>
                <p className="section-kicker mono">02 / WATCH SCOPE</p>
                <h1>Build your watchlist.</h1>
              </div>
              <p>
                Choose up to 3 assets for a public monitoring session. Create a profile to save a larger watchlist and map personal exposure. The dashboard will only show
                event records when one of these assets has a corporate action.
              </p>
              <div className="setup-quick-help mono"><HelpLabel label="WATCHLIST">{helpCopy.watchScope}</HelpLabel><HelpLabel label="EVENT RECORD" align="end">An official corporate action that matches a selected asset.</HelpLabel></div>
            </div>
            <div className="asset-catalog-toolbar">
              <label>
                <Search size={16} />
                <input
                  value={assetSearch}
                  onChange={(event) => setAssetSearch(event.target.value)}
                  placeholder="Search symbol or company"
                />
              </label>
              <div className="asset-catalog-meta mono">
                <span>
                  {catalogMode === "loading" ? "SYNCING CATALOG" : `${assetCatalog.length} ${catalogMode === "live" ? "LIVE" : "FALLBACK"} ASSETS`}
                </span>
                <button type="button" onClick={selectAllAssets} disabled={allAssetsSelected || catalogMode === "loading"}>
                  SELECT {Math.min(PUBLIC_WATCHLIST_ASSETS, visibleAssets.length)}
                </button>
                <button type="button" onClick={clearSelectedAssets} disabled={selectedAssets.length === 0}>
                  CLEAR
                </button>
              </div>
            </div>
            <div className="asset-selector live-asset-selector">
              {visibleAssets.map((asset) => {
                const selected = selectedAssetSet.has(asset.tokenSymbol);
                return (
                  <button
                    style={{ contentVisibility: "auto", containIntrinsicSize: "112px" }}
                    aria-pressed={selected}
                    className={selected ? "selected" : ""}
                    key={asset.id ?? asset.tokenSymbol}
                    onClick={() => toggleAsset(asset.tokenSymbol)}
                  >
                    <span className="asset-check">{selected ? "✓" : "+"}</span>
                    <strong>{asset.tokenSymbol}</strong>
                    <span>{cleanAssetName(asset.tokenName)}</span>
                    <small className="mono">ACTIVE · CHAIN 4663</small>
                  </button>
                );
              })}
            </div>
            <div className="setup-controls">
              <button className="back-button" onClick={() => setStep(1)}><ArrowLeft size={17} /> Back</button>
              <span className="mono">{selectedAssets.length} / {PUBLIC_WATCHLIST_ASSETS} WATCHED · {visibleAssets.length} SHOWN</span>
              <button className="setup-next" disabled={selectedAssets.length === 0} onClick={() => setStep(3)}>
                Set policy <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-panel compact-setup">
            <div className="setup-heading">
              <p className="section-kicker mono">03 / PROTECTION POLICY</p>
              <h1>Choose the response.</h1>
              <p>
                Observe is the working production mode. Guard and Automate are shown as the next
                product layers and cannot execute yet.
              </p>
              <div className="setup-quick-help mono"><HelpLabel label="OBSERVE">Read-only monitoring and recommendations. Nothing executes.</HelpLabel><HelpLabel label="GUARD / AUTOMATE" align="end">{helpCopy.next}</HelpLabel></div>
            </div>
            <div className="mode-selector">
              {modes.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? "selected" : ""}
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  disabled={item.id !== "observe"}
                >
                  <span className="mode-top mono"><i>{item.jp}</i>{item.price}</span>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                  <span className="mode-radio">{mode === item.id ? "●" : "○"}</span>
                </button>
              ))}
            </div>
            <div className="configuration-summary mono">
              <p><span>IDENTITY</span><strong>READ-ONLY</strong></p>
              <p><span>WATCHLIST</span><strong>{selectedAssets.length} ASSETS</strong></p>
              <p><span>POLICY</span><strong>{selectedMode.label}</strong></p>
              <p><span>EXECUTION</span><strong>DISABLED</strong></p>
            </div>
            <div className="setup-controls">
              <button className="back-button" onClick={() => setStep(2)}><ArrowLeft size={17} /> Back</button>
              <span className="mono">READY TO INITIALIZE</span>
              <button className="setup-next" onClick={completeSetup}>
                Open MIHARI <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
