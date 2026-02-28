import { getERPClient } from "@/lib/erp-client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get("company")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  if (!company || !startDate || !endDate) {
    return Response.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    const client = await getERPClient()
    const data = await client.getProfitAndLoss(company, startDate, endDate)
    
    // Ensure data is not undefined/null before sanitizing
    const sanitizedData = data === undefined || data === null ? {} : data
    
    // Return with async info if available
    const response = {
      data: JSON.parse(JSON.stringify(sanitizedData)),
      async: false,
      timestamp: new Date().toISOString(),
    }
    
    return Response.json(response)
  } catch (error) {
    console.error("[v0] P&L API error:", error)
    return Response.json(
      { error: "Failed to fetch P&L data", async: false, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
