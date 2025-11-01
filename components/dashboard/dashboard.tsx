"use client"

import { useState } from "react"
import Header from "./header"
import Sidebar from "./sidebar"
import ChartsGrid from "./charts-grid"
import InsightsPanel from "./insights-panel"
import ExportDialog from "./export-dialog"
import { Loader2 } from "lucide-react"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useToast } from "@/hooks/use-toast"
import type { ExportData } from "@/lib/export"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>("Interwood")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const { toast } = useToast()

  // Fetch all dashboard data including chart values and insights
  const { data, loading, error, refresh } = useDashboardData(selectedCompany, dateRange.start, dateRange.end)

  const handleRefresh = () => {
    refresh()
    toast({
      title: "Refreshing data",
      description: "Fetching latest financial information...",
      duration: 2000,
    })
  }

  const handleExport = () => {
    if (!selectedCompany) {
      toast({
        title: "Select a company",
        description: "Please select a company before exporting data.",
        variant: "destructive",
      })
      return
    }
    setExportDialogOpen(true)
  }

  const exportData: ExportData = {
    company: selectedCompany,
    dateRange,
    profitAndLoss: data.profitAndLoss,
    balanceSheet: data.balanceSheet,
    cashFlow: data.cashFlow,
    receivables: data.receivables,
    payables: data.payables,
    insights: data.insights || undefined,
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading financial data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="text-red-400">
                  <p className="font-semibold">Error loading data</p>
                  <p className="text-sm text-slate-400">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Charts Grid */}
              <ChartsGrid dateRange={dateRange} company={selectedCompany} />

              {/* Insights Section */}
              <InsightsPanel insights={data.insights || ""} />
            </div>
          )}
        </main>
      </div>

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} data={exportData} />
    </div>
  )
}
