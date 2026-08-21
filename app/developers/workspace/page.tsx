import { redirect } from "next/navigation";
import { DeveloperWorkspace } from "@/components/developer-workspace";
import { getAuthenticatedAccount } from "@/lib/account";

export const metadata = { title: "Developer Workspace - MIHARI", description: "Private API key and usage management for MIHARI Intelligence API." };

export default async function DeveloperWorkspacePage() {
  const account = await getAuthenticatedAccount();
  if (!account) redirect("/sign-in?redirect_url=%2Fdevelopers%2Fworkspace");
  return <DeveloperWorkspace />;
}
