import { type NextRequest, NextResponse } from "next/server"

const protectedRoutes = ["/dashboard", "/api/erp", "/api/ai"]
const publicRoutes = ["/", "/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublic = publicRoutes.includes(pathname)

  // Check for authentication cookie
  const authCookie = request.cookies.get("auth_user")?.value

  if (isProtected && !authCookie) {
    // Redirect to login if accessing protected route without auth
    return NextResponse.redirect(new URL("/", request.url))
  }

  if ((pathname === "/" || pathname === "/login") && authCookie) {
    // Redirect to dashboard if accessing login while authenticated
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
