/**
 * AI Report Processor - Optimized for token efficiency
 * Extracts only summary totals from ERPNext financial reports
 * Reduces data payload by >90% compared to full report transmission
 */

interface ReportSummary {
  report: string
  company: string
  period: string
  totals: Record<string, number | string>
  timestamp: string
}

interface PreparedReportResponse {
  prepared_report?: boolean
  report_name?: string
  [key: string]: any
}

/**
 * Extracts financial totals from Profit & Loss report
 */
export function extractPLSummary(data: any, company: string, period: string): ReportSummary {
  const totals: Record<string, number | string> = {}

  if (!data || !data.result) {
    return { report: "Profit and Loss", company, period, totals, timestamp: new Date().toISOString() }
  }

  const result = data.result

  // Look for Total Income, Total Expense, Net Profit/Loss rows
  if (Array.isArray(result)) {
    for (const row of result) {
      const label = (row[0] || row.account || "").toString().toLowerCase()
      const value = parseFloat(row[1] || row.value || 0)

      if (label.includes("total income")) totals.total_income = value
      if (label.includes("total expense")) totals.total_expense = value
      if (label.includes("net profit") || label.includes("net loss")) totals.net_profit = value
    }
  }

  return {
    report: "Profit and Loss",
    company,
    period,
    totals: totals.total_income ? totals : { status: "incomplete_data" },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Extracts financial totals from Balance Sheet report
 */
export function extractBSSummary(data: any, company: string, period: string): ReportSummary {
  const totals: Record<string, number | string> = {}

  if (!data || !data.result) {
    return { report: "Balance Sheet", company, period, totals, timestamp: new Date().toISOString() }
  }

  const result = data.result

  if (Array.isArray(result)) {
    for (const row of result) {
      const label = (row[0] || row.account || "").toString().toLowerCase()
      const value = parseFloat(row[1] || row.value || 0)

      if (label.includes("total asset")) totals.total_assets = value
      if (label.includes("total liabilit")) totals.total_liabilities = value
      if (label.includes("total equity") || label.includes("total stockholders")) totals.total_equity = value
    }
  }

  return {
    report: "Balance Sheet",
    company,
    period,
    totals: totals.total_assets ? totals : { status: "incomplete_data" },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Extracts cash flow totals from Cash Flow report
 */
export function extractCFSummary(data: any, company: string, period: string): ReportSummary {
  const totals: Record<string, number | string> = {}

  if (!data || !data.result) {
    return { report: "Cash Flow", company, period, totals, timestamp: new Date().toISOString() }
  }

  const result = data.result

  if (Array.isArray(result)) {
    for (const row of result) {
      const label = (row[0] || row.account || "").toString().toLowerCase()
      const value = parseFloat(row[1] || row.value || 0)

      if (label.includes("operating")) totals.operating_cash_flow = value
      if (label.includes("investing")) totals.investing_cash_flow = value
      if (label.includes("financing")) totals.financing_cash_flow = value
      if (label.includes("net cash")) totals.net_cash_flow = value
    }
  }

  return {
    report: "Cash Flow",
    company,
    period,
    totals: totals.operating_cash_flow ? totals : { status: "incomplete_data" },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Extracts totals from Accounts Receivable
 */
export function extractARSummary(data: any, company: string): ReportSummary {
  const totals: Record<string, number | string> = {}
  let totalReceivables = 0

  if (data && data.result && Array.isArray(data.result)) {
    for (const row of data.result) {
      const value = parseFloat(row.outstanding_amount || row[1] || 0)
      if (!isNaN(value)) totalReceivables += value
    }
  }

  totals.total_receivables = totalReceivables

  return {
    report: "Accounts Receivable",
    company,
    period: "Current",
    totals,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Extracts totals from Accounts Payable
 */
export function extractAPSummary(data: any, company: string): ReportSummary {
  const totals: Record<string, number | string> = {}
  let totalPayables = 0

  if (data && data.result && Array.isArray(data.result)) {
    for (const row of data.result) {
      const value = parseFloat(row.outstanding_amount || row[1] || 0)
      if (!isNaN(value)) totalPayables += value
    }
  }

  totals.total_payables = totalPayables

  return {
    report: "Accounts Payable",
    company,
    period: "Current",
    totals,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Checks if a report response indicates async processing
 */
export function isPreparedReport(response: any): boolean {
  return response?.prepared_report === true
}

/**
 * Consolidates all report summaries for AI analysis
 * Dramatically reduces token usage by providing only totals
 */
export function consolidateReportSummaries(reports: {
  pl?: ReportSummary
  bs?: ReportSummary
  cf?: ReportSummary
  ar?: ReportSummary
  ap?: ReportSummary
}): string {
  const summary = {
    timestamp: new Date().toISOString(),
    reports: Object.fromEntries(
      Object.entries(reports)
        .filter(([, v]) => v && !Object.keys(v.totals).includes("status"))
        .map(([key, value]) => [key, value])
    ),
  }

  return JSON.stringify(summary, null, 2)
}
