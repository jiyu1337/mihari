import { AuthBoundary } from "@/components/auth-boundary";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <AuthBoundary>{children}</AuthBoundary>;
}
