"use client"
import { Card } from "@/components/ui/card"
import { BarChart3, TrendingUp, Wallet, PieChart, ArrowRightLeft, Zap } from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const menuItems = [
  { icon: BarChart3, label: "Overview", href: "#overview" },
  { icon: TrendingUp, label: "Profit & Loss", href: "#pl" },
  { icon: Wallet, label: "Balance Sheet", href: "#balance" },
  { icon: PieChart, label: "Cash Flow", href: "#cashflow" },
  { icon: ArrowRightLeft, label: "Receivables", href: "#receivables" },
  { icon: Zap, label: "AI Insights", href: "#insights" },
]

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const [activeItem, setActiveItem] = useState("overview")

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 border-r border-slate-700 bg-slate-900/80 backdrop-blur-sm transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0`}
      >
        <div className="p-6 space-y-8">
          {/* Logo */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">ERP3D</h2>
            <p className="text-xs text-slate-500">Financial Intelligence</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => setActiveItem(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeItem === item.href
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Stats Card */}
          <Card className="border-slate-700 bg-slate-800/50 p-4">
            <div className="space-y-3">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Last Updated</div>
              <div className="text-sm text-slate-300">
                {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => onOpenChange(false)} />}
    </>
  )
}
