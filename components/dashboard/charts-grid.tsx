"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Chart3D from "./chart-3d-placeholder.tsx"
import { useEffect, useState } from "react"
import { fetchProfitLoss, fetchBalanceSheet, fetchCashFlow, fetchReceivables, fetchPayables } from "@/lib/api-client" 

interface ChartsGridProps {
  dateRange: { start: string; end: string }
  company: string
}

const charts = [
  { id: "pl", title: "Profit & Loss Overview", type: "bar", fetcher: fetchProfitLoss },
  { id: "balance", title: "Balance Sheet Summary", type: "pie", fetcher: fetchBalanceSheet },
  { id: "cashflow", title: "Cash Flow Movement", type: "line", fetcher: fetchCashFlow },
  { id: "araging", title: "Accounts Receivable Aging", type: "column", fetcher: fetchReceivables },
  { id: "apaging", title: "Accounts Payable Aging", type: "column", fetcher: fetchPayables },
]

export default function ChartsGrid({ dateRange, company }: ChartsGridProps) {
  const [chartData, setChartData] = useState<Record<string, number[]>>({})

  useEffect(() => {
    charts.forEach(async (chart) => {
      try {
        const data: any = await chart.fetcher(company, dateRange.start, dateRange.end)
        let chartValues: number[] = []

        if (chart.id === "pl" || chart.id === "balance" || chart.id === "cashflow") {
          // 1. Logic for Financial Statements (P&L, Balance Sheet, Cash Flow)
          // The data is nested under chart.data.datasets[0].values
          const datasets = data?.chart?.data?.datasets
          if (datasets?.length > 0) {
            // Take the values from the first dataset (usually the main metric)
            chartValues = datasets[0].values.map((v: any) => Number(v) || 0)
          }
        } else if (chart.id === "araging" || chart.id === "apaging") {
          // 2. Logic for Aging Reports (Receivables/Payables)
          // Extract the ranges from the final total row of the result array
          const rawResults = data?.result;
          const totalRow = rawResults?.[rawResults.length - 1]

          if (Array.isArray(totalRow) && totalRow[0] === "Total") {
            // Indices 11 to 15 represent range1 (0-30 days) to range5 (121-Above)
            const rawRanges = totalRow.slice(11, 16) 
            chartValues = rawRanges.map((v: any) => Number(v) || 0)
          }
        }

        setChartData((prev) => ({ ...prev, [chart.id]: chartValues }))

      } catch (err) {
        console.error(`[v0] Failed to fetch ${chart.title}:`, err)
      }
    })
  }, [company, dateRange])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart) => (
        <Card key={chart.id} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-slate-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-white">{chart.title}</CardTitle>
            <CardDescription className="text-slate-400">{chart.type.toUpperCase()} 3D Chart</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData[chart.id] && chartData[chart.id].length > 0 ? (
              <Chart3D chartType={chart.type as any} data={chartData[chart.id]} />
            ) : (
              <div className="text-slate-400 text-sm text-center">Loading...</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
