"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, Search, Wallet } from "lucide-react";
import type { RobinhoodAsset } from "@/lib/robinhood";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const CHAIN_ID = 4663;
const CHAIN_ID_HEX = "0x1237";
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

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function cleanAssetName(name: string) {
  return name.replace(" • Robinhood Token", "");
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? Number((error as { code?: unknown }).code)
    : undefined;
}

export function OnboardingConsole() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [wallet, setWallet] = useState("");
  const [walletError, setWalletError] = useState("");
  const [selectedAssets, setSelectedAssets] = useState(["NVDA", "AAPL", "TSLA"]);
  const [assetCatalog, setAssetCatalog] = useState<RobinhoodAsset[]>(fallbackAssets);
  const [catalogMode, setCatalogMode] = useState<"loading" | "live" | "fallback">("loading");
  const [assetSearch, setAssetSearch] = useState("");
  const [mode, setMode] = useState("observe");

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const saved = JSON.parse(window.localStorage.getItem("mihari:configuration") ?? "{}") as {
        wallet?: string;
        assets?: string[];
      };
      restoreTimer = window.setTimeout(() => {
        if (saved.wallet) setWallet(saved.wallet);
        if (saved.assets?.length) setSelectedAssets(saved.assets);
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
    () => assetCatalog.length > 0 && assetCatalog.every((asset) => selectedAssetSet.has(asset.tokenSymbol)),
    [assetCatalog, selectedAssetSet],
  );

  async function connectWallet() {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("No EVM wallet detected. Install Robinhood Wallet or another EVM wallet, or continue read-only.");
      return;
    }

    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts[0]) throw new Error("No wallet account returned");

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        if (getErrorCode(switchError) !== 4902) throw switchError;
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_ID_HEX,
            chainName: "Robinhood Chain",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
            blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
          }],
        });
      }

      setWallet(accounts[0]);
    } catch {
      setWalletError("Connection or network switch was cancelled. Read-only mode remains available.");
    }
  }

  function toggleAsset(symbol: string) {
    setSelectedAssets((current) =>
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  }

  function selectAllAssets() {
    setSelectedAssets([...new Set(assetCatalog.map((asset) => asset.tokenSymbol))]);
  }

  function clearSelectedAssets() {
    setSelectedAssets([]);
  }

  async function completeSetup() {
    window.localStorage.setItem("mihari:configuration", JSON.stringify({
      wallet,
      walletChainId: wallet ? CHAIN_ID : null,
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
                Wallet connection is a read-only identity today. MIHARI requests an account
                and switches to Robinhood Chain, but never asks for transaction approval here.
              </p>
            </div>
            <div className="identity-options">
              <Link className="identity-choice" href="/sign-in">
                <span className="choice-index mono">A-01 / PERSONAL MAP</span>
                <Mail size={28} strokeWidth={1.4} />
                <strong>Sign in with email</strong>
                <small>Save watchlists, link wallets and map your positions</small>
                <ArrowRight size={18} />
              </Link>
              <button className={`identity-choice ${wallet ? "selected" : ""}`} onClick={connectWallet}>
                <span className="choice-index mono">A–01 / CHAIN 4663</span>
                <Wallet size={28} strokeWidth={1.4} />
                <strong>{wallet ? shortAddress(wallet) : "Connect wallet"}</strong>
                <small>{wallet ? "Connected on Robinhood Chain · read-only" : "Robinhood Wallet or any EVM wallet"}</small>
                {wallet && <Check size={18} />}
              </button>
              <button className="identity-choice" onClick={() => setStep(2)}>
                <span className="choice-index mono">A–02 / NO WALLET</span>
                <span className="readonly-glyph mono">R/O</span>
                <strong>Continue read-only</strong>
                <small>No funds, signature or transaction permissions</small>
                <ArrowRight size={18} />
              </button>
            </div>
            {walletError && <p className="setup-error mono">{walletError}</p>}
            {wallet && (
              <button className="setup-next" onClick={() => setStep(2)}>
                Continue with wallet <ArrowRight size={18} />
              </button>
            )}
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
                Choose from the live Robinhood Stock Token catalog. The dashboard will only show
                event records when one of these assets has a corporate action.
              </p>
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
                  SELECT ALL
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
              <span className="mono">{selectedAssets.length} WATCHED · {visibleAssets.length} SHOWN</span>
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
              <p><span>IDENTITY</span><strong>{wallet ? `${shortAddress(wallet)} · CHAIN 4663` : "READ-ONLY"}</strong></p>
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
