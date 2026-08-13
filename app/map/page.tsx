import { MapConsole } from "@/components/map-console";
import { isClerkConfigured } from "@/lib/auth-config";

export const metadata = {
  title: "MAP - MIHARI",
  description: "Personal Stock Token exposure mapping on Robinhood Chain.",
};

export default async function MapPage() {
  if (!isClerkConfigured()) return <MapConsole authUnavailable />;
  return <MapConsole />;
}
