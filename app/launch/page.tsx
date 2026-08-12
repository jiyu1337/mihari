import { OnboardingConsole } from "@/components/onboarding-console";
import { SiteHeader } from "@/components/site-header";

export default function LaunchPage() {
  return (
    <main className="launch-page paper-noise">
      <SiteHeader />
      <OnboardingConsole />
    </main>
  );
}
