"use client"
import { Card } from "@/components/ui/card"
import {
  BarChart3,
  TrendingUp,
  Wallet,
  PieChart,
  ArrowRightLeft,
  CreditCard,
  Zap,
  LogOut,
  RotateCcw,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { fetchCompanies } from "@/lib/api-client"

export type ReportId = "overview" | "pl" | "balance" | "cashflow" | "receivables" | "payables" | "insights"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSection: ReportId
  onSectionChange: (section: ReportId) => void
  selectedCompany?: string
  onCompanyChange?: (company: string) => void
  dateRange?: { start: string; end: string }
  onDateRangeChange?: (range: { start: string; end: string }) => void
  onRefresh?: () => void
  onExport?: () => void
}

const menuItems: Array<{ id: ReportId; icon: typeof BarChart3; label: string }> = [
  { id: "overview", icon: BarChart3, label: "Overview" },
  { id: "pl", icon: TrendingUp, label: "Profit & Loss" },
  { id: "balance", icon: Wallet, label: "Balance Sheet" },
  { id: "cashflow", icon: PieChart, label: "Cash Flow" },
  { id: "receivables", icon: ArrowRightLeft, label: "Receivables" },
  { id: "payables", icon: CreditCard, label: "Payables" },
  { id: "insights", icon: Zap, label: "AI Insights" },
]

export default function Sidebar({
  open,
  onOpenChange,
  activeSection,
  onSectionChange,
  selectedCompany = "",
  onCompanyChange,
  dateRange = { start: "", end: "" },
  onDateRangeChange,
  onRefresh,
  onExport,
}: SidebarProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState(false)

  // CHANGE: Load companies for mobile sidebar selector
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setCompaniesError(false)
        const data = await fetchCompanies()
        const companyList = Array.isArray(data)
          ? data.filter(Boolean)
          : Array.isArray(data?.companies)
            ? data.companies.filter(Boolean)
            : []
        setCompanies(companyList)
        if (companyList.length > 0 && !selectedCompany && onCompanyChange) {
          onCompanyChange(companyList[0])
        }
      } catch (err) {
        console.error("[v0] Failed to fetch companies:", err)
        setCompaniesError(true)
      } finally {
        setCompaniesLoading(false)
      }
    }
    loadCompanies()
  }, [])

  const handleMenuClick = (id: ReportId) => {
    onSectionChange(id)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  const handleRefreshClick = async () => {
    setIsRefreshing(true)
    onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          h-screen border-r border-slate-700 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 z-40
          fixed left-0 top-0
          ${open ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          md:static md:translate-x-0
          ${open ? "md:w-64" : "md:w-0 md:overflow-hidden"}
        `}
      >
        <div className={`flex flex-col h-full ${!open && "md:opacity-0"}`}>
          {/* Top Section */}
          <div className="p-6 space-y-8 flex-1 overflow-auto">
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
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
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

          {/* CHANGE: Footer section with mobile controls - visible on mobile when sidebar is open */}
          <div className="md:hidden border-t border-slate-700 p-6 space-y-4">
            {/* Company Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Company</label>
              <Select value={selectedCompany || ""} onValueChange={(value) => onCompanyChange?.(value)}>
                <SelectTrigger className="w-full border-slate-700 bg-slate-800/50 text-slate-200">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {companiesLoading && <div className="px-2 py-1 text-sm text-slate-400">Loading...</div>}
                  {companiesError && <div className="px-2 py-1 text-sm text-red-400">Error loading</div>}
                  {!companiesLoading &&
                    !companiesError &&
                    companies.map((company) => (
                      <SelectItem key={company} value={company} className="text-slate-200">
                        {company}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => onDateRangeChange?.({ ...dateRange, start: e.target.value })}
                className="border-slate-700 bg-slate-800/50 text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => onDateRangeChange?.({ ...dateRange, end: e.target.value })}
                className="border-slate-700 bg-slate-800/50 text-slate-200"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
              >
                <RotateCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="text-xs">Refresh</span>
              </Button>
              <Button onClick={() => onExport?.()} className="gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200">
                <Download className="h-4 w-4" />
                <span className="text-xs">Export</span>
              </Button>
            </div>

            {/* Logout Button */}
            <Button onClick={handleLogout} className="w-full gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => onOpenChange(false)} />}
    </>
  )
}
