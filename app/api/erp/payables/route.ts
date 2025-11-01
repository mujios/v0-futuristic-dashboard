import { getERPClient } from "@/lib/erp-client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get("company")

  if (!company) {
    return Response.json({ error: "Missing company parameter" }, { status: 400 })
  }

  try {
    const client = await getERPClient()
    const data = await client.getAccountsPayable(company)
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Payables API error:", error)
    return Response.json({ error: "Failed to fetch payables data" }, { status: 500 })
  }
}
