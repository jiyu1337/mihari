"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Wallet } from "lucide-react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const assets = [
  { symbol: "AAPLx", name: "Apple", event: "Dividend watch" },
  { symbol: "NVDAx", name: "NVIDIA", event: "Multiplier watch" },
  { symbol: "TSLAx", name: "Tesla", event: "Quote integrity" },
  { symbol: "AMZNx", name: "Amazon", event: "Corporate actions" },
  { symbol: "MSFTx", name: "Microsoft", event: "Dividend watch" },
  { symbol: "SPYx", name: "S&P 500 ETF", event: "NAV integrity" },
];

const modes = [
  {
    id: "observe",
    label: "OBSERVE",
    jp: "観察",
    price: "FREE",
    description: "AI explanations, event feed and alerts. No transaction permissions.",
  },
  {
    id: "guard",
    label: "GUARD",
    jp: "保護",
    price: "TESTNET",
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

export function OnboardingConsole() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [wallet, setWallet] = useState("");
  const [walletError, setWalletError] = useState("");
  const [selectedAssets, setSelectedAssets] = useState(["NVDAx", "AAPLx", "TSLAx"]);
  const [mode, setMode] = useState("observe");

  const selectedMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);

  async function connectWallet() {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("No EVM wallet detected. You can continue in read-only mode.");
      return;
    }

    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts[0]) setWallet(accounts[0]);
    } catch {
      setWalletError("Wallet connection was cancelled. Read-only mode remains available.");
    }
  }

  function toggleAsset(symbol: string) {
    setSelectedAssets((current) =>
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  }

  function completeSetup() {
    const configuration = {
      wallet,
      assets: selectedAssets,
      mode,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("mihari:configuration", JSON.stringify(configuration));
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
          <div className="setup-panel">
            <div className="setup-heading">
              <p className="section-kicker mono">01 / IDENTITY LAYER</p>
              <h1>How should MIHARI recognize you?</h1>
              <p>
                A wallet links protection policies to Robinhood Chain. It is optional for
                free monitoring and MIHARI never asks for a seed phrase.
              </p>
            </div>
            <div className="identity-options">
              <button className={`identity-choice ${wallet ? "selected" : ""}`} onClick={connectWallet}>
                <span className="choice-index mono">A–01</span>
                <Wallet size={28} strokeWidth={1.4} />
                <strong>{wallet ? shortAddress(wallet) : "Connect EVM wallet"}</strong>
                <small>{wallet ? "Connected for testnet policy setup" : "Recommended for onchain protection"}</small>
                {wallet && <Check size={18} />}
              </button>
              <button className="identity-choice" onClick={() => setStep(2)}>
                <span className="choice-index mono">A–02</span>
                <span className="readonly-glyph mono">R/O</span>
                <strong>Continue read-only</strong>
                <small>No wallet, no funds and no transaction permissions</small>
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
          <div className="setup-panel">
            <div className="setup-heading">
              <p className="section-kicker mono">02 / WATCH SCOPE</p>
              <h1>Select the assets that matter.</h1>
              <p>
                This initial list becomes your event filter. Vault and lending position
                discovery will be added after wallet indexing is enabled.
              </p>
            </div>
            <div className="asset-selector">
              {assets.map((asset) => {
                const selected = selectedAssets.includes(asset.symbol);
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "selected" : ""}
                    key={asset.symbol}
                    onClick={() => toggleAsset(asset.symbol)}
                  >
                    <span className="asset-check">{selected ? "✓" : "+"}</span>
                    <strong>{asset.symbol}</strong>
                    <span>{asset.name}</span>
                    <small className="mono">{asset.event}</small>
                  </button>
                );
              })}
            </div>
            <div className="setup-controls">
              <button className="back-button" onClick={() => setStep(1)}><ArrowLeft size={17} /> Back</button>
              <span className="mono">{selectedAssets.length} ASSETS SELECTED</span>
              <button className="setup-next" disabled={selectedAssets.length === 0} onClick={() => setStep(3)}>
                Set policy <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-panel">
            <div className="setup-heading">
              <p className="section-kicker mono">03 / PROTECTION POLICY</p>
              <h1>Choose how the system responds.</h1>
              <p>
                Start safely. Changing to an execution policy later will always require
                explicit wallet approval and a clear transaction preview.
              </p>
            </div>
            <div className="mode-selector">
              {modes.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? "selected" : ""}
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  disabled={item.id === "automate"}
                >
                  <span className="mode-top mono"><i>{item.jp}</i>{item.price}</span>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                  <span className="mode-radio">{mode === item.id ? "●" : "○"}</span>
                </button>
              ))}
            </div>
            <div className="configuration-summary mono">
              <p><span>IDENTITY</span><strong>{wallet ? shortAddress(wallet) : "READ-ONLY"}</strong></p>
              <p><span>WATCHING</span><strong>{selectedAssets.join(" · ")}</strong></p>
              <p><span>POLICY</span><strong>{selectedMode.label}</strong></p>
              <p><span>NETWORK</span><strong>ROBINHOOD TESTNET / 46630</strong></p>
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
