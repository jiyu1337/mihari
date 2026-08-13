"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function ProfileSignOut() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/wallet/logout", { method: "POST" }).catch(() => undefined);
    if (isSignedIn) {
      await signOut({ redirectUrl: "/" });
      return;
    }
    router.push("/");
    router.refresh();
  }

  return <button className="workspace-signout" onClick={() => void logout()}><LogOut size={15} />Sign out</button>;
}
