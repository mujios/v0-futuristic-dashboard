import { generateFinancialInsights } from "@/lib/gemini-client"
import { getERPClient } from "@/lib/erp-client"
import {
  extractPLSummary,
  extractBSSummary,
  extractCFSummary,
  extractARSummary,
  extractAPSummary,
  consolidateReportSummaries,
  isPreparedReport,
} from "@/lib/ai-report-processor"

export async function POST(request: Request) {
  try {
    const { company, startDate, endDate } = await request.json()

    if (!company) {
      return Response.json({ error: "Missing company parameter" }, { status: 400 })
    }

    // Fetch financial data
    const client = await getERPClient()
    const [plData, bsData, cfData, arData, apData] = await Promise.allSettled([
      client.getProfitAndLoss(company, startDate, endDate),
      client.getBalanceSheet(company, startDate, endDate),
      client.getCashFlow(company, startDate, endDate),
      client.getAccountsReceivable(company),
      client.getAccountsPayable(company),
    ])

    // Extract only summary totals to reduce token usage by >90%
    const period = startDate && endDate ? `${startDate} to ${endDate}` : "Current Period"

    const reports = {
      pl: extractPLSummary(
        plData.status === "fulfilled" ? plData.value : null,
        company,
        period
      ),
      bs: extractBSSummary(
        bsData.status === "fulfilled" ? bsData.value : null,
        company,
        period
      ),
      cf: extractCFSummary(
        cfData.status === "fulfilled" ? cfData.value : null,
        company,
        period
      ),
      ar: extractARSummary(
        arData.status === "fulfilled" ? arData.value : null,
        company
      ),
      ap: extractAPSummary(
        apData.status === "fulfilled" ? apData.value : null,
        company
      ),
    }

    // Consolidate summaries for AI analysis
    const optimizedData = consolidateReportSummaries(reports)
    console.log("[v0] Consolidated data for AI (token-optimized):", optimizedData)

    // Generate insights using Gemini with optimized data
    const insights = await generateFinancialInsights(JSON.parse(optimizedData), company)

    return Response.json({ insights })
  } catch (error) {
    console.error("[v0] Insights API error:", error)
    return Response.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
