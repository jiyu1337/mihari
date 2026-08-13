import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/auth-config";

const isProtectedRoute = createRouteMatcher([
  "/map(.*)",
  "/api/profile(.*)",
  "/api/wallets(.*)",
]);

const configuredProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect();
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
