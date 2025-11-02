"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Chart3D from "./chart-3d-placeholder.tsx"
import { normalizeReport } from "@/lib/data-processor"
import type { ReportId } from "./sidebar"

interface ChartsGridProps {
  data: any
  dateRange: { start: string; end: string }
  company: string
}

export default function ChartsGrid({ data, dateRange, company }: ChartsGridProps) {
  const getChartData = (reportId: ReportId): number[] => {
    const normalized = normalizeReport(reportId, data, company)
    return normalized?.chart3DData || []
  }

  const reportIds: ReportId[] = ["pl", "balance", "cashflow", "receivables", "payables"]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {reportIds.map((reportId) => {
        const normalized = normalizeReport(reportId, data, company)
        if (!normalized) return null

        const chartTypeMap: Record<ReportId, "bar" | "pie" | "line" | "column" | "radar"> = {
          pl: "bar",
          balance: "pie",
          cashflow: "line",
          receivables: "column",
          payables: "column",
          overview: "bar",
          insights: "bar",
        }

        const chartData = normalized.chart3DData

        return (
          <Card
            key={reportId}
            className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-slate-600 transition-colors"
          >
            <CardHeader>
              <CardTitle className="text-white">{normalized.title}</CardTitle>
              <CardDescription className="text-slate-400">
                {chartTypeMap[reportId].toUpperCase()} 3D Chart
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <Chart3D chartType={chartTypeMap[reportId]} data={chartData} />
              ) : (
                <div className="text-slate-400 text-sm text-center h-64 flex items-center justify-center">
                  Loading...
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
