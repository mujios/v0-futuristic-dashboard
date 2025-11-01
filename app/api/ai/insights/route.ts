import { generateFinancialInsights } from "@/lib/gemini-client"
import { getERPClient } from "@/lib/erp-client"

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

    const financialData = {
      profitAndLoss: plData.status === "fulfilled" ? plData.value : null,
      balanceSheet: bsData.status === "fulfilled" ? bsData.value : null,
      cashFlow: cfData.status === "fulfilled" ? cfData.value : null,
      receivables: arData.status === "fulfilled" ? arData.value : null,
      payables: apData.status === "fulfilled" ? apData.value : null,
    }

    // Generate insights using Gemini
    const insights = await generateFinancialInsights(financialData, company)

    return Response.json({ insights })
  } catch (error) {
    console.error("[v0] Insights API error:", error)
    return Response.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
