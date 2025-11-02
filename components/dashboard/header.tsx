"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menu, LogOut, RotateCcw, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchCompanies } from "@/lib/api-client"

interface HeaderProps {
  onToggleSidebar: () => void
  selectedCompany: string
  onCompanyChange: (company: string) => void
  dateRange: { start: string; end: string }
  onDateRangeChange: (range: { start: string; end: string }) => void
  onRefresh: () => void
  onExport: () => void
}

export default function Header({
  onToggleSidebar,
  selectedCompany,
  onCompanyChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExport,
}: HeaderProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState(false)

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

        console.log("[v0] Companies loaded:", companyList)
        setCompanies(companyList)

        if (companyList.length > 0 && !selectedCompany) {
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
    onRefresh()
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <Select value={selectedCompany || ""} onValueChange={onCompanyChange}>
            <SelectTrigger className="w-40 border-slate-700 bg-slate-800/50 text-slate-200">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {companiesLoading && <div className="px-2 py-1 text-sm text-slate-400">Loading companies...</div>}
              {companiesError && <div className="px-2 py-1 text-sm text-red-400">Failed to load companies</div>}
              {!companiesLoading && !companiesError && companies.length > 0 ? (
                companies.map((company) => (
                  <SelectItem key={company} value={company} className="text-slate-200">
                    {company}
                  </SelectItem>
                ))
              ) : !companiesLoading && !companiesError ? (
                <div className="px-2 py-1 text-sm text-slate-400">No companies found</div>
              ) : null}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
            <span className="text-sm text-slate-400">From:</span>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="border-0 bg-transparent text-slate-200 text-sm w-28 focus:ring-0 px-0"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
            <span className="text-sm text-slate-400">To:</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="border-0 bg-transparent text-slate-200 text-sm w-28 focus:ring-0 px-0"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-50"
            title="Refresh data"
          >
            <RotateCcw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
            title="Export data"
          >
            <Download className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
