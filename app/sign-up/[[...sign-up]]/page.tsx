import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand-mark";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="auth-page-single paper-noise">
        <div className="auth-unavailable">
          <p className="mono">PROFILE ACCESS / SETUP REQUIRED</p>
          <h2>Email profiles are being connected.</h2>
          <Link className="primary-action" href="/launch">Continue read-only</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page paper-noise">
      <section className="auth-plate">
        <Link className="auth-brand" href="/">
          <BrandMark />
          <span>MIHARI</span>
        </Link>
        <div className="auth-copy">
          <p className="mono">MIHARI MAP / CREATE PROFILE</p>
          <h1>One profile for every position you protect.</h1>
          <p>Create your MIHARI profile, then verify one or more wallets to build a personal exposure map.</p>
        </div>
        <div className="auth-status mono">
          <span>PERSONAL PROFILE</span>
          <strong>WALLETS LINK AFTER SIGN-UP</strong>
        </div>
      </section>
      <section className="auth-form-shell">
        <SignUp
          path="/sign-up"
          routing="path"
          fallbackRedirectUrl="/map"
          signInFallbackRedirectUrl="/map"
          signInUrl="/sign-in"
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
      </section>
    </main>
  );
}
