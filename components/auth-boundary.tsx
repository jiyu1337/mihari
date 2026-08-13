import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/auth-config";

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  return isClerkConfigured() ? (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      localization={{
        signIn: {
          start: {
            title: "Sign in to MIHARI",
            titleCombined: "Continue to MIHARI",
            subtitle: "Use your email and password to open your personal workspace.",
            subtitleCombined: "Sign in or create your MIHARI profile.",
          },
        },
        signUp: {
          start: {
            title: "Create your MIHARI profile",
            titleCombined: "Continue to MIHARI",
            subtitle: "Create an email and password, then link wallets and map your Stock Token exposure.",
            subtitleCombined: "Sign in or create your MIHARI profile.",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  ) : children;
}
