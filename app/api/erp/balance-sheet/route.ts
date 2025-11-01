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
    const data = await client.getBalanceSheet(company, startDate, endDate)
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Balance Sheet API error:", error)
    return Response.json({ error: "Failed to fetch Balance Sheet data" }, { status: 500 })
  }
}
