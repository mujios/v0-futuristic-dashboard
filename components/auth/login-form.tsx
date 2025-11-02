"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const DEFAULT_USERNAME = "Administrator"
const DEFAULT_PASSWORD = "admin"

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Submitting login with username:", formData.username)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          // ERPNext URL and credentials come from environment variables on the server
        }),
      })

      console.log("[v0] Login response status:", response.status)

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Login error:", data)
        throw new Error(data.error || data.message || "Login failed")
      }

      console.log("[v0] Login successful")

      // Wait for cookies to be set
      await new Promise((resolve) => setTimeout(resolve, 500))

      router.push("/dashboard")
    } catch (err) {
      console.error("[v0] Login exception:", err)
      setError(err instanceof Error ? err.message : "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Sign In</CardTitle>
        <CardDescription className="text-slate-400">
          Enter your dashboard credentials to access financial intelligence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">Username</label>
            <Input
              type="text"
              name="username"
              placeholder="your@email.com"
             // value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-slate-600 bg-slate-800/50 text-white placeholder-slate-500"
            />
            {/*<p className="text-xs text-slate-500">Default: {DEFAULT_USERNAME}</p>*/}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">Password</label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              //value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-slate-600 bg-slate-800/50 text-white placeholder-slate-500"
            />
            {/*<p className="text-xs text-slate-500">Default: {DEFAULT_PASSWORD}</p>*/}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
