import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { validateConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

// Validate configuration on app startup
const configErrors = validateConfig()

if (configErrors.length > 0 && process.env.NODE_ENV === "production") {
  console.error("[v0] Configuration errors:", configErrors)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        {configErrors.length > 0 && process.env.NODE_ENV !== "production" && (
          <div className="bg-yellow-900/20 border border-yellow-600 text-yellow-200 p-4 text-sm">
            <p className="font-semibold mb-2">Configuration Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
              {configErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
