import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth-config";
import { WALLET_SESSION_COOKIE, verifyWalletSessionToken } from "@/lib/wallet-session";

const isMapRoute = createRouteMatcher(["/map(.*)"]);
const isProtectedApiRoute = createRouteMatcher(["/api/profile(.*)", "/api/wallets(.*)"]);

const configuredProxy = clerkMiddleware(async (auth, request) => {
  if (!isMapRoute(request) && !isProtectedApiRoute(request)) return;

  const { userId } = await auth();
  if (userId) return;

  const walletSession = await verifyWalletSessionToken(request.cookies.get(WALLET_SESSION_COOKIE)?.value);
  if (walletSession) return;

  if (isProtectedApiRoute(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("redirect_url", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
}, {
  frontendApiProxy: { enabled: true },
});

export default isClerkConfigured() ? configuredProxy : function proxy() {};

export const config = {
  matcher: [
    "/map/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/api/profile/:path*",
    "/api/wallets/:path*",
  ],
};
