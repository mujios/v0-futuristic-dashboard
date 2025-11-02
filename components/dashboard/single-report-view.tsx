"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Chart3D from "./chart-3d-placeholder"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { ReportId } from "./sidebar"

interface SingleReportViewProps {
  sectionId: ReportId
  data: any
  dateRange: { start: string; end: string }
  company: string
}

// Web3 color palette for neon aesthetics
const NEON_COLORS = ["#06b6d4", "#0ea5e9", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"]

export default function SingleReportView({ sectionId, data, dateRange, company }: SingleReportViewProps) {
  const getReportTitle = (id: ReportId): string => {
    const titles: Record<ReportId, string> = {
      overview: "Dashboard Overview",
      pl: "Profit & Loss Statement",
      balance: "Balance Sheet",
      cashflow: "Cash Flow Analysis",
      receivables: "Accounts Receivable Aging",
      payables: "Accounts Payable Aging",
      insights: "AI Insights",
    }
    return titles[id]
  }

  const getReportDescription = (id: ReportId): string => {
    const descriptions: Record<ReportId, string> = {
      overview: "Complete financial overview and key metrics",
      pl: "Revenue, expenses, and profit analysis",
      balance: "Assets, liabilities, and equity snapshot",
      cashflow: "Cash inflows and outflows tracking",
      receivables: "Customer payment aging analysis",
      payables: "Vendor payment aging analysis",
      insights: "AI-powered financial insights",
    }
    return descriptions[id]
  }

  // Parse financial statement data for 2D charts
  const getFinancialChartData = () => {
    if (sectionId === "pl" && data.profitAndLoss?.chart?.data?.datasets) {
      const dataset = data.profitAndLoss.chart.data.datasets[0]
      const labels = data.profitAndLoss.chart.data.labels || []
      return labels.map((label: string, idx: number) => ({
        name: label,
        value: Number(dataset.values?.[idx] || 0),
      }))
    }
    if (sectionId === "balance" && data.balanceSheet?.chart?.data?.datasets) {
      const dataset = data.balanceSheet.chart.data.datasets[0]
      const labels = data.balanceSheet.chart.data.labels || []
      return labels.map((label: string, idx: number) => ({
        name: label,
        value: Number(dataset.values?.[idx] || 0),
      }))
    }
    if (sectionId === "cashflow" && data.cashFlow?.chart?.data?.datasets) {
      const dataset = data.cashFlow.chart.data.datasets[0]
      const labels = data.cashFlow.chart.data.labels || []
      return labels.map((label: string, idx: number) => ({
        name: label,
        value: Number(dataset.values?.[idx] || 0),
      }))
    }
    return []
  }

  // Get 3D chart data
  const get3DChartData = (): number[] => {
    if (sectionId === "pl" && data.profitAndLoss?.chart?.data?.datasets?.[0]?.values) {
      return data.profitAndLoss.chart.data.datasets[0].values.map((v: any) => Number(v) || 0)
    }
    if (sectionId === "balance" && data.balanceSheet?.chart?.data?.datasets?.[0]?.values) {
      return data.balanceSheet.chart.data.datasets[0].values.map((v: any) => Number(v) || 0)
    }
    if (sectionId === "cashflow" && data.cashFlow?.chart?.data?.datasets?.[0]?.values) {
      return data.cashFlow.chart.data.datasets[0].values.map((v: any) => Number(v) || 0)
    }
    if (
      (sectionId === "receivables" || sectionId === "payables") &&
      data[sectionId === "receivables" ? "receivables" : "payables"]?.result
    ) {
      const result = data[sectionId === "receivables" ? "receivables" : "payables"].result
      const totalRow = result[result.length - 1]
      if (Array.isArray(totalRow) && totalRow[0] === "Total") {
        return totalRow.slice(11, 16).map((v: any) => Number(v) || 0)
      }
    }
    return []
  }

  // Get table data based on report type
  const getTableData = () => {
    if (sectionId === "pl" && data.profitAndLoss?.result) {
      return data.profitAndLoss.result.slice(0, 10)
    }
    if (sectionId === "balance" && data.balanceSheet?.result) {
      return data.balanceSheet.result.slice(0, 10)
    }
    if (sectionId === "cashflow" && data.cashFlow?.result) {
      return data.cashFlow.result.slice(0, 10)
    }
    if (sectionId === "receivables" && data.receivables?.result) {
      return data.receivables.result.slice(0, 15)
    }
    if (sectionId === "payables" && data.payables?.result) {
      return data.payables.result.slice(0, 15)
    }
    return []
  }

  const chartData = getFinancialChartData()
  const chart3dData = get3DChartData()
  const tableData = getTableData()

  // Determine chart type based on section
  const getChartType = (): "bar" | "pie" | "line" | "column" | "radar" => {
    if (sectionId === "pl") return "bar"
    if (sectionId === "balance") return "pie"
    if (sectionId === "cashflow") return "line"
    if (sectionId === "receivables" || sectionId === "payables") return "column"
    return "bar"
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{getReportTitle(sectionId)}</h2>
        <p className="text-slate-400">{getReportDescription(sectionId)}</p>
      </div>

      {/* Charts Section - 2D and 3D side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2D Recharts Chart */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:border-cyan-500/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-cyan-400">2D Chart View</CardTitle>
            <CardDescription className="text-slate-400">Interactive 2D visualization</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {getChartType() === "bar" || getChartType() === "column" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      labelStyle={{ color: "#06b6d4" }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : getChartType() === "line" ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      labelStyle={{ color: "#06b6d4" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      labelStyle={{ color: "#06b6d4" }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* 3D Chart */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:border-blue-500/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-blue-400">3D Chart View</CardTitle>
            <CardDescription className="text-slate-400">Interactive 3D visualization</CardDescription>
          </CardHeader>
          <CardContent>
            {chart3dData.length > 0 ? (
              <Chart3D chartType={getChartType()} data={chart3dData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-cyan-400">Detailed Data</CardTitle>
          <CardDescription className="text-slate-400">Full report data table</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {tableData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  {sectionId === "receivables" || sectionId === "payables" ? (
                    <>
                      <TableHead className="text-cyan-400">Name</TableHead>
                      <TableHead className="text-cyan-400">Amount</TableHead>
                      <TableHead className="text-cyan-400">0-30 Days</TableHead>
                      <TableHead className="text-cyan-400">30-60 Days</TableHead>
                      <TableHead className="text-cyan-400">60-90 Days</TableHead>
                      <TableHead className="text-cyan-400">90-120 Days</TableHead>
                      <TableHead className="text-cyan-400">120+ Days</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-cyan-400">Account</TableHead>
                      <TableHead className="text-cyan-400">Amount</TableHead>
                      <TableHead className="text-cyan-400">Percentage</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row: any, idx: number) => (
                  <TableRow key={idx} className="border-slate-700 hover:bg-slate-800/50">
                    {Array.isArray(row) ? (
                      row
                        .slice(0, sectionId === "receivables" || sectionId === "payables" ? 7 : 3)
                        .map((cell: any, cellIdx: number) => (
                          <TableCell
                            key={cellIdx}
                            className={cellIdx === 0 ? "text-white font-medium" : "text-slate-300"}
                          >
                            {typeof cell === "number"
                              ? cell.toLocaleString("en-US", { maximumFractionDigits: 2 })
                              : cell}
                          </TableCell>
                        ))
                    ) : (
                      <TableCell className="text-slate-300">{String(row)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400">No data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
