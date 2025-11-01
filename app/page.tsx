import LoginForm from "@/components/auth/login-form"
import { config } from "@/lib/config"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{config.appName}</h1>
          <p className="text-slate-400">Real-time Financial Intelligence with AI</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
