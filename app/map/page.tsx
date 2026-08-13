import { currentUser } from "@clerk/nextjs/server";
import { MapConsole } from "@/components/map-console";
import { isClerkConfigured } from "@/lib/auth-config";

export const metadata = {
  title: "MAP - MIHARI",
  description: "Personal Stock Token exposure mapping on Robinhood Chain.",
};

export default async function MapPage() {
  if (!isClerkConfigured()) return <MapConsole email={null} authUnavailable />;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;
  return <MapConsole email={email} />;
}
