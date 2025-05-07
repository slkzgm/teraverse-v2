import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>
}
