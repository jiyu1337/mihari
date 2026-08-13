import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand-mark";
import { WalletAuthButton } from "@/components/wallet-auth-button";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignInPage() {
  return (
    <main className="auth-page paper-noise">
      <section className="auth-plate">
        <Link className="auth-brand" href="/">
          <BrandMark />
          <span>MIHARI</span>
        </Link>
        <div className="auth-copy">
          <p className="mono">MIHARI MAP / PERSONAL EXPOSURE</p>
          <h1>Your positions. Their events. One risk map.</h1>
          <p>Sign in to save watchlists, link wallets and see which corporate actions touch your Stock Tokens.</p>
        </div>
        <div className="auth-status mono">
          <span>EMAIL ACCESS</span>
          <strong>EMAIL AND PASSWORD</strong>
        </div>
      </section>
      <section className="auth-form-shell">
        <div className="mihari-auth-stack">
          <div className="mihari-auth-method">
            <p className="mono">01 / WALLET ACCESS</p>
            <WalletAuthButton />
          </div>
          <div className="mihari-auth-divider mono"><span>OR CONTINUE WITH EMAIL</span></div>
          {isClerkConfigured() ? (
            <SignIn
            path="/sign-in"
            routing="path"
            fallbackRedirectUrl="/map"
            signUpFallbackRedirectUrl="/map"
            signUpUrl="/sign-up"
            appearance={{
              variables: {
                colorPrimary: "#ccff00",
                colorBackground: "#faf9f5",
                colorForeground: "#10110d",
                colorMutedForeground: "#777772",
                borderRadius: "0px",
                fontFamily: "Manrope Variable, Arial, sans-serif",
              },
              elements: {
                rootBox: "mihari-auth-root",
                cardBox: "mihari-auth-card-box",
                card: "mihari-auth-card",
                headerTitle: "mihari-auth-title",
                headerSubtitle: "mihari-auth-subtitle",
                formButtonPrimary: "mihari-auth-submit",
                footer: "mihari-auth-footer",
              },
            }}
            />
          ) : (
            <div className="auth-unavailable">
            <p className="mono">PROFILE ACCESS / SETUP REQUIRED</p>
            <h2>Email profiles are being connected.</h2>
            <p>Public Observe mode remains available now.</p>
            <Link className="primary-action" href="/launch">Continue read-only</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
