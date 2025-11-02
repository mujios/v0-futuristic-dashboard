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
    console.log(`[v0] Normalizing report ${reportId}`, rawData)

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
    if (!reportKey) {
      console.warn(`[v0] No report key found for ${reportId}`)
      return null
    }

    const report = rawData[reportKey]
    if (!report) {
      console.warn(`[v0] Report ${reportKey} not found in rawData`)
      return null
    }

    // Initialize normalized structure
    const normalized: NormalizedReport = {
      title: getTitleForReport(reportId),
      currency: report.chart?.currency || "PKR",
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

    console.log(`[v0] Normalized report:`, normalized)
    return normalized
  } catch (error) {
    console.error(`[v0] Error normalizing ${reportId}:`, error)
    return null
  }
}

function processFinancialStatement(normalized: NormalizedReport, report: any, reportId: ReportId): void {
  console.log(`[v0] Processing financial statement: ${reportId}`, report)

  if (report.chart?.data?.datasets) {
    const dataset = report.chart.data.datasets[0]
    const labels = report.chart.data.labels || []
    normalized.chart2DData = labels.map((label: string, idx: number) => ({
      name: sanitizeAccountName(String(label || "")),
      value: Math.abs(Number(dataset.data?.[idx] || dataset.values?.[idx] || 0)),
    }))
  }

  if (report.chart?.data?.datasets?.[0]) {
    const dataset = report.chart.data.datasets[0]
    const rawData = dataset.data || dataset.values // Use 'values' if 'data' is not present

    if (rawData && Array.isArray(rawData)) {
      normalized.chart3DData = rawData.map((v: any) => Math.abs(Number(v) || 0))
      normalized.chart3DLabels = (report.chart.data.labels || []).map((l: string) =>
        sanitizeAccountName(String(l || "")),
      )
    }
  }

  if (Array.isArray(report.result)) {
    const excludePatterns = ["Total", "Profit for the year", "Asset", "Liability", "Funds", "Expense"]

    if (report.columns && Array.isArray(report.columns)) {
      normalized.columns = report.columns.map((col: any) => ({
        key: col.fieldname,
        label: col.label || col.fieldname,
        isNumeric: col.fieldtype === "Currency" || col.fieldtype === "Float" || col.fieldtype === "Int",
        isAccountName: col.label === "Account" || col.label === "Section" || col.fieldname === "account_name",
      }))
    } else {
      // Fallback columns
      normalized.columns = [
        { key: "account", label: "Account", isNumeric: false, isAccountName: true },
        { key: "value", label: "Amount", isNumeric: true, isAccountName: false },
      ]
    }

    normalized.rows = report.result
      .filter((row: any) => {
        if (typeof row !== "object" || row === null) return false
        // Check if row contains summary keywords
        const rowStr = JSON.stringify(row)
        return !excludePatterns.some((pattern) => rowStr.includes(pattern))
      })
      .slice(0, 15) // Limit to first 15 rows
      .map((row: any) => {
        const normalizedRow: any = {}

        // Map each column using the key from the column definition
        normalized.columns.forEach((col) => {
          if (row[col.key] !== undefined) {
            if (col.isNumeric) {
              normalizedRow[col.key] = Number.parseFloat(String(row[col.key]) || "0")
            } else if (col.isAccountName) {
              normalizedRow[col.key] = sanitizeAccountName(String(row[col.key] || ""))
            } else {
              normalizedRow[col.key] = String(row[col.key] || "")
            }
          }
        })

        return normalizedRow
      })
  }
}

function processAgingReport(normalized: NormalizedReport, report: any, reportId: ReportId): void {
  console.log(`[v0] Processing aging report: ${reportId}`, report)

  if (!Array.isArray(report.result)) {
    console.warn(`[v0] No result array in aging report`)
    return
  }

  const columnConfig: TableColumn[] = [
    {
      key: "name",
      label: reportId === "receivables" ? "Customer" : "Supplier",
      isNumeric: false,
      isAccountName: true,
    },
    { key: "invoiced", label: "Invoiced", isNumeric: true, isAccountName: false },
    { key: "outstanding", label: "Outstanding", isNumeric: true, isAccountName: false },
    { key: "range1", label: "0-30 Days", isNumeric: true, isAccountName: false },
    { key: "range2", label: "30-60 Days", isNumeric: true, isAccountName: false },
    { key: "range3", label: "60-90 Days", isNumeric: true, isAccountName: false },
    { key: "range4", label: "90-120 Days", isNumeric: true, isAccountName: false },
    { key: "range5", label: "120+ Days", isNumeric: true, isAccountName: false },
  ]

  normalized.columns = columnConfig

  const totalRow = report.result[report.result.length - 1]
  if (Array.isArray(totalRow)) {
    console.log(`[v0] Total row found:`, totalRow)
    
    // Correct indices for aging buckets from the Total array (indices 7 through 11)
    const chart3DDataValues = [
      Number(totalRow[7] || 0), // 0-30 Days (range1)
      Number(totalRow[8] || 0), // 31-60 Days (range2)
      Number(totalRow[9] || 0), // 61-90 Days (range3)
      Number(totalRow[10] || 0), // 91-120 Days (range4)
      Number(totalRow[11] || 0), // 121-Above (range5)
    ]
    const chart3DLabelsValues = ["0-30", "30-60", "61-90", "90-120", "120+"]

    // Assign to normalized report for 3D chart
    normalized.chart3DData = chart3DDataValues
    normalized.chart3DLabels = chart3DLabelsValues

    // FIX: Populate chart2DData for Recharts
    normalized.chart2DData = chart3DLabelsValues.map((label, index) => ({
        name: label,
        value: chart3DDataValues[index],
    }));
  }

  normalized.rows = report.result
    .filter((row: any, idx: number) => {
      // Exclude the last row (Total array) and nulls
      if (idx === report.result.length - 1 && Array.isArray(row)) return false
      return typeof row === "object" && row !== null
    })
    .slice(0, 15)
    .map((row: any) => {
      const normalizedRow: any = {}

      // The raw data uses 'party' for the name field, so we must check for it first.
      if (typeof row === "object" && !Array.isArray(row)) {
        // Object-based row
        normalizedRow.name = sanitizeAccountName(String(row.party || row.name || row.customer || row.supplier || "")) // <-- FIXED: Added 'row.party' check
        normalizedRow.invoiced = Number.parseFloat(String(row.invoiced || 0))
        normalizedRow.outstanding = Number.parseFloat(String(row.outstanding || 0))
        normalizedRow.range1 = Number.parseFloat(String(row.range1 || 0))
        normalizedRow.range2 = Number.parseFloat(String(row.range2 || 0))
        normalizedRow.range3 = Number.parseFloat(String(row.range3 || 0))
        normalizedRow.range4 = Number.parseFloat(String(row.range4 || 0))
        normalizedRow.range5 = Number.parseFloat(String(row.range5 || 0))
        return normalizedRow
      } 
      // Removed the unnecessary and potentially incorrect `else if (Array.isArray(row))` block.
      return null
    }).filter(Boolean) // Filter out nulls
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
