import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
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
    <main className="auth-page auth-page-single paper-noise">
      <SignUp path="/sign-up" routing="path" fallbackRedirectUrl="/map" signInFallbackRedirectUrl="/map" />
    </main>
  );
}
