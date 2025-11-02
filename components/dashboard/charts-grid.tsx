"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Chart3D from "./chart-3d-placeholder.tsx"

interface ChartsGridProps {
  data: any
  dateRange: { start: string; end: string }
  company: string
}

const charts = [
  { id: "pl", title: "Profit & Loss Overview", type: "bar" as const },
  { id: "balance", title: "Balance Sheet Summary", type: "pie" as const },
  { id: "cashflow", title: "Cash Flow Movement", type: "line" as const },
  { id: "araging", title: "Accounts Receivable Aging", type: "column" as const },
  { id: "apaging", title: "Accounts Payable Aging", type: "column" as const },
]

export default function ChartsGrid({ data, dateRange, company }: ChartsGridProps) {
  // Extract chart data from props
  const getChartData = (chartId: string): number[] => {
    if (chartId === "pl" && data?.profitAndLoss?.chart?.data?.datasets?.[0]?.values) {
      return data.profitAndLoss.chart.data.datasets[0].values.map((v: any) => Number(v) || 0)
    }
    if (chartId === "balance" && data?.balanceSheet?.chart?.data?.datasets?.[0]?.values) {
      return data.balanceSheet.chart.data.datasets[0].values.map((v: any) => Number(v) || 0)
    }
    if (chartId === "cashflow" && data?.cashFlow?.chart?.data?.datasets?.[0]?.values) {
      return data.cashFlow.chart.data.datasets[0].values.map((v: any) => Number(v) || 0)
    }
    if (chartId === "araging" && data?.receivables?.result) {
      const result = data.receivables.result
      const totalRow = result[result.length - 1]
      if (Array.isArray(totalRow) && totalRow[0] === "Total") {
        return totalRow.slice(11, 16).map((v: any) => Number(v) || 0)
      }
    }
    if (chartId === "apaging" && data?.payables?.result) {
      const result = data.payables.result
      const totalRow = result[result.length - 1]
      if (Array.isArray(totalRow) && totalRow[0] === "Total") {
        return totalRow.slice(11, 16).map((v: any) => Number(v) || 0)
      }
    }
    return []
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart) => {
        const chartData = getChartData(chart.id)
        return (
          <Card
            key={chart.id}
            className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-slate-600 transition-colors"
          >
            <CardHeader>
              <CardTitle className="text-white">{chart.title}</CardTitle>
              <CardDescription className="text-slate-400">{chart.type.toUpperCase()} 3D Chart</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <Chart3D chartType={chart.type} data={chartData} />
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
