import { cookies } from "next/headers"

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const authUser = cookieStore.get("auth_user")?.value

    if (!authUser) {
      return null
    }

    return {
      authenticated: true,
      user: "authenticated",
    }
  } catch (error) {
    console.error("[v0] Session error:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
