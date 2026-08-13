import { AuthBoundary } from "@/components/auth-boundary";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <AuthBoundary>{children}</AuthBoundary>;
}
