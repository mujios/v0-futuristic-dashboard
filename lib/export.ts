// Export utilities for dashboard data

export interface ExportData {
  company: string
  dateRange: { start: string; end: string }
  profitAndLoss?: unknown
  balanceSheet?: unknown
  cashFlow?: unknown
  receivables?: unknown
  payables?: unknown
  insights?: string
}

export function generateCSV(data: ExportData): string {
  const headers = [
    "Financial Report Export",
    `Company: ${data.company}`,
    `Period: ${data.dateRange.start} to ${data.dateRange.end}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "",
  ]
  const rows: string[] = []

  rows.push(headers.join(","))
  rows.push(",")

  // Add sections with better formatting
  if (data.profitAndLoss) {
    rows.push('"Profit & Loss Statement"')
    rows.push(JSON.stringify(data.profitAndLoss, null, 2))
    rows.push(",")
  }

  if (data.balanceSheet) {
    rows.push('"Balance Sheet"')
    rows.push(JSON.stringify(data.balanceSheet, null, 2))
    rows.push(",")
  }

  if (data.cashFlow) {
    rows.push('"Cash Flow Statement"')
    rows.push(JSON.stringify(data.cashFlow, null, 2))
    rows.push(",")
  }

  if (data.receivables) {
    rows.push('"Accounts Receivable"')
    rows.push(JSON.stringify(data.receivables, null, 2))
    rows.push(",")
  }

  if (data.payables) {
    rows.push('"Accounts Payable"')
    rows.push(JSON.stringify(data.payables, null, 2))
    rows.push(",")
  }

  if (data.insights) {
    rows.push('"AI Insights"')
    rows.push(`"${data.insights.replace(/"/g, '""')}"`)
    rows.push(",")
  }

  return rows.join("\n")
}

export function generateJSON(data: ExportData): string {
  return JSON.stringify(
    {
      metadata: {
        exportDate: new Date().toISOString(),
        company: data.company,
        dateRange: data.dateRange,
      },
      report: data,
    },
    null,
    2,
  )
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportAsCSV(data: ExportData) {
  const csv = generateCSV(data)
  const filename = `financial-report-${data.company}-${new Date().toISOString().split("T")[0]}.csv`
  downloadFile(csv, filename, "text/csv")
}

export function exportAsJSON(data: ExportData) {
  const json = generateJSON(data)
  const filename = `financial-report-${data.company}-${new Date().toISOString().split("T")[0]}.json`
  downloadFile(json, filename, "application/json")
}

export function exportAsPDF(data: ExportData) {
  // Note: For production, consider using a library like jsPDF or html2pdf
  const content = `
FINANCIAL REPORT
Company: ${data.company}
Period: ${data.dateRange.start} to ${data.dateRange.end}
Generated: ${new Date().toISOString()}

PROFIT & LOSS
${JSON.stringify(data.profitAndLoss, null, 2)}

BALANCE SHEET
${JSON.stringify(data.balanceSheet, null, 2)}

CASH FLOW
${JSON.stringify(data.cashFlow, null, 2)}

RECEIVABLES
${JSON.stringify(data.receivables, null, 2)}

PAYABLES
${JSON.stringify(data.payables, null, 2)}

AI INSIGHTS
${data.insights || "No insights available"}
  `.trim()

  const filename = `financial-report-${data.company}-${new Date().toISOString().split("T")[0]}.txt`
  downloadFile(content, filename, "text/plain")
}
