import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password)
      return Response.json({ message: "Missing required fields" }, { status: 400 })

    const dashboardUsername = process.env.DASHBOARD_USERNAME
    const dashboardPassword = process.env.DASHBOARD_PASS

    if (username !== dashboardUsername.trim() || password !== dashboardPassword) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const erpUrl = process.env.NEXT_PUBLIC_ERP_URL
    const erpApiKey = process.env.ERP_API_KEY
    const erpApiSecret = process.env.ERP_API_SECRET

    const cookieStore = await cookies()
    cookieStore.set("erpUrl", erpUrl, { httpOnly: true, secure: true, sameSite: "lax" })
    cookieStore.set("erpApiKey", erpApiKey, { httpOnly: true, secure: true, sameSite: "lax" })
    cookieStore.set("erpApiSecret", erpApiSecret, { httpOnly: true, secure: true, sameSite: "lax" })
    cookieStore.set("auth_user", "authenticated", { httpOnly: true, secure: true, sameSite: "lax" })

    return Response.json({ success: true, message: "Login successful" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return Response.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
