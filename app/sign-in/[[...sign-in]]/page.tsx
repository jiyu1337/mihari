import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand-mark";
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
          <strong>NO PASSWORD REQUIRED</strong>
        </div>
      </section>
      <section className="auth-form-shell">
        {isClerkConfigured() ? (
          <SignIn
            path="/sign-in"
            routing="path"
            fallbackRedirectUrl="/map"
            signUpFallbackRedirectUrl="/map"
            appearance={{
              variables: {
                colorPrimary: "#10110d",
                colorBackground: "#faf9f5",
                borderRadius: "0px",
                fontFamily: "Manrope Variable, Arial, sans-serif",
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
      </section>
    </main>
  );
}
