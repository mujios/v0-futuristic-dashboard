"use client"

import { useState } from "react"
import Header from "./header"
import Sidebar from "./sidebar"
import ChartsGrid from "./charts-grid"
import InsightsPanel from "./insights-panel"
import ExportDialog from "./export-dialog"
import { Loader2 } from "lucide-react"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>("All Companies")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [showExport, setShowExport] = useState(false)

  const { data, loading, error, refresh } = useDashboardData(selectedCompany, dateRange.start, dateRange.end)

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
          onRefresh={refresh}
          onExport={() => setShowExport(true)}
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
                <p className="text-red-400">Error loading data: {error}</p>
                <button onClick={refresh} className="text-cyan-400 hover:text-cyan-300 underline">
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Charts Grid */}
              <ChartsGrid dateRange={dateRange} />

              {/* Insights Section */}
              <InsightsPanel insights={data.insights} />
            </div>
          )}
        </main>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        data={{
          company: selectedCompany,
          dateRange,
          ...data,
        }}
      />
    </div>
  )
}
