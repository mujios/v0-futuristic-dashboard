import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("erpUrl")
  cookieStore.delete("erpApiKey")
  cookieStore.delete("erpApiSecret")
  cookieStore.delete("auth_user")

  return Response.json({ message: "Logged out successfully" }, { status: 200 })
}
