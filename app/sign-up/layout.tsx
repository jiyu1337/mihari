import { AuthBoundary } from "@/components/auth-boundary";

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <AuthBoundary>{children}</AuthBoundary>;
}
