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
import type { SingleReportViewProps } from "./sidebar"
import { normalizeReport } from "@/lib/data-processor"
import { getReportDescription } from "@/lib/report-description"

// Web3 color palette for neon aesthetics
const NEON_COLORS = ["#06b6d4", "#0ea5e9", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"]

export default function SingleReportView({ sectionId, data, dateRange, company }: SingleReportViewProps) {
  console.log(`[v0] SingleReportView rendering with sectionId: ${sectionId}`, { data, company })

  const parsedData = normalizeReport(sectionId, data, company)

  console.log(`[v0] Parsed data result:`, parsedData)

  if (!parsedData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Unable to load report data</p>
      </div>
    )
  }

  const chartData = parsedData.chart2DData
  const chart3dData = parsedData.chart3DData
  const tableData = parsedData.rows
  const chart3dLabels = parsedData.chart3DLabels

  console.log(`[v0] Chart data:`, chartData)
  console.log(`[v0] Table data:`, tableData)
  console.log(`[v0] Columns:`, parsedData.columns)

  // Determine chart type based on section
  const getChartType = (): "bar" | "pie" | "line" | "column" | "radar" => {
    if (sectionId === "pl") return "bar"
    if (sectionId === "balance") return "pie"
    if (sectionId === "cashflow") return "line"
    if (sectionId === "receivables" || sectionId === "payables") return "column"
    return "bar"
  }
  
  // Helper to determine if we are rendering a horizontal bar chart (for P&L)
  const isHorizontalBar = getChartType() === "bar"

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{parsedData.title}</h2>
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
                  <BarChart 
                    data={chartData} 
                    // Use vertical layout for horizontal bars (P&L)
                    layout={isHorizontalBar ? "vertical" : "horizontal"}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    
                    {/* XAxis is numeric for horizontal bar chart (P&L) */}
                    <XAxis 
                      type={isHorizontalBar ? "number" : "category"}
                      dataKey={isHorizontalBar ? undefined : "name"} 
                      stroke="#94a3b8" 
                    />
                    
                    {/* YAxis is categorical (for names) for horizontal bar chart (P&L) */}
                    <YAxis 
                      type={isHorizontalBar ? "category" : "number"}
                      dataKey={isHorizontalBar ? "name" : undefined}
                      stroke="#94a3b8" 
                    />
                    
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
              <div className="h-64 flex items-center justify-center text-slate-400">No chart data available</div>
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
              <Chart3D chartType={getChartType()} data={chart3dData} labels={chart3dLabels} />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">No 3D data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table - Use normalized columns and rows */}
      <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-cyan-400">Detailed Data</CardTitle>
          <CardDescription className="text-slate-400">
            Full report data table ({tableData.length} rows, {parsedData.columns.length} columns)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {tableData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  {parsedData.columns.map((col) => (
                    <TableHead key={col.key} className="text-cyan-400">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row: any, idx: number) => (
                  <TableRow key={idx} className="border-slate-700 hover:bg-slate-800/50">
                    {parsedData.columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={col.isAccountName ? "text-white font-medium" : "text-slate-300"}
                      >
                        {col.isNumeric && typeof row[col.key] === "number"
                          ? row[col.key].toLocaleString("en-US", { maximumFractionDigits: 2 })
                          : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400">
              No data available for this report
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
