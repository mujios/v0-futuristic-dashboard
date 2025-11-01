import Dashboard from "@/components/dashboard/dashboard"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  try {
    await requireAuth()
  } catch (error) {
    redirect("/")
  }

  return <Dashboard />
}
