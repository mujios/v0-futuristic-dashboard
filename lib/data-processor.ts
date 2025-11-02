import type { ReportId } from "@/components/dashboard/sidebar"

export interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

export interface TableColumn {
  key: string
  label: string
  isNumeric: boolean
  isAccountName: boolean
}

export interface NormalizedReport {
  title: string
  currency: string
  columns: TableColumn[]
  rows: any[]
  chart2DData: ChartDataPoint[]
  chart3DData: number[]
  chart3DLabels: string[]
  rawReport: any
}

function sanitizeAccountName(name: string): string {
  if (!name) return ""
  return name
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeReport(reportId: ReportId, rawData: any, companyName: string): NormalizedReport | null {
  try {
    // Extract the appropriate report from rawData
    const reportMap: Record<ReportId, string> = {
      overview: "",
      pl: "profitAndLoss",
      balance: "balanceSheet",
      cashflow: "cashFlow",
      receivables: "receivables",
      payables: "payables",
      insights: "",
    }

    const reportKey = reportMap[reportId]
    if (!reportKey) return null

    const report = rawData[reportKey]
    if (!report) return null

    // Initialize normalized structure
    const normalized: NormalizedReport = {
      title: getTitleForReport(reportId),
      currency: "USD",
      columns: [],
      rows: [],
      chart2DData: [],
      chart3DData: [],
      chart3DLabels: [],
      rawReport: report,
    }

    // Process based on report type
    if (reportId === "pl" || reportId === "balance" || reportId === "cashflow") {
      processFinancialStatement(normalized, report, reportId)
    } else if (reportId === "receivables" || reportId === "payables") {
      processAgingReport(normalized, report, reportId)
    }

    return normalized
  } catch (error) {
    console.error(`[v0] Error normalizing ${reportId}:`, error)
    return null
  }
}

function processFinancialStatement(normalized: NormalizedReport, report: any, reportId: ReportId): void {
  // Extract 2D chart data from chart section
  if (report.chart?.data?.datasets) {
    const dataset = report.chart.data.datasets[0]
    const labels = report.chart.data.labels || []
    normalized.chart2DData = labels.map((label: string, idx: number) => ({
      name: label,
      value: Math.abs(Number(dataset.values?.[idx] || 0)), // Use absolute value
    }))
  }

  // Extract 3D chart data
  if (report.chart?.data?.datasets?.[0]?.values) {
    normalized.chart3DData = report.chart.data.datasets[0].values.map((v: any) => Math.abs(Number(v) || 0))
    normalized.chart3DLabels = report.chart.data.labels || []
  }

  // Process table rows with filtering
  if (Array.isArray(report.result)) {
    const excludePatterns = ["Total", "Profit for the year", "Asset", "Liability", "Funds"]
    const columnConfig: TableColumn[] = [
      { key: "account_name", label: "Account", isNumeric: false, isAccountName: true },
      { key: "amount", label: "Amount", isNumeric: true, isAccountName: false },
      { key: "percentage", label: "%", isNumeric: true, isAccountName: false },
    ]

    normalized.columns = columnConfig
    normalized.rows = report.result
      .slice(0, 10) // Limit to first 10 rows
      .filter((row: any) => {
        if (!Array.isArray(row) || row.length === 0) return false
        const accountName = String(row[0] || "")
        return !excludePatterns.some((pattern) => accountName.includes(pattern))
      })
      .map((row: any) => ({
        account_name: sanitizeAccountName(String(row[0] || "")),
        amount: Number(row[1] || 0),
        percentage: Number(row[2] || 0),
      }))
  }
}

function processAgingReport(normalized: NormalizedReport, report: any, reportId: ReportId): void {
  if (!Array.isArray(report.result)) return

  const columnConfig: TableColumn[] = [
    { key: "name", label: reportId === "receivables" ? "Customer" : "Supplier", isNumeric: false, isAccountName: true },
    { key: "amount", label: "Amount", isNumeric: true, isAccountName: false },
    { key: "aging_0_30", label: "0-30 Days", isNumeric: true, isAccountName: false },
    { key: "aging_30_60", label: "30-60 Days", isNumeric: true, isAccountName: false },
    { key: "aging_60_90", label: "60-90 Days", isNumeric: true, isAccountName: false },
    { key: "aging_90_120", label: "90-120 Days", isNumeric: true, isAccountName: false },
    { key: "aging_120_plus", label: "120+ Days", isNumeric: true, isAccountName: false },
  ]

  normalized.columns = columnConfig

  // Extract aging bucket data from total row (typically row 7+)
  const totalRow = report.result[report.result.length - 1]
  if (Array.isArray(totalRow) && totalRow[0] === "Total") {
    normalized.chart3DData = totalRow.slice(11, 16).map((v: any) => Number(v) || 0)
    normalized.chart3DLabels = ["0-30", "30-60", "60-90", "90-120", "120+"]
  }

  // Process rows
  normalized.rows = report.result.slice(0, 15).map((row: any) => ({
    name: sanitizeAccountName(String(row[0] || "")),
    amount: Number(row[1] || 0),
    aging_0_30: Number(row[11] || 0),
    aging_30_60: Number(row[12] || 0),
    aging_60_90: Number(row[13] || 0),
    aging_90_120: Number(row[14] || 0),
    aging_120_plus: Number(row[15] || 0),
  }))
}

function getTitleForReport(reportId: ReportId): string {
  const titles: Record<ReportId, string> = {
    overview: "Dashboard Overview",
    pl: "Profit & Loss Statement",
    balance: "Balance Sheet",
    cashflow: "Cash Flow Analysis",
    receivables: "Accounts Receivable Aging",
    payables: "Accounts Payable Aging",
    insights: "AI Insights",
  }
  return titles[reportId]
}
