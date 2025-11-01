import { getERPClient } from "@/lib/erp-client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get("company")

  if (!company) {
    return Response.json({ error: "Missing company parameter" }, { status: 400 })
  }

  try {
    const client = await getERPClient()
    const data = await client.getAccountsReceivable(company)
    console.log(data)
    // FIX: Ensure data is not undefined/null before sanitizing and returning.
    const sanitizedData = data === undefined || data === null ? {} : data;

    // The previous fix: return Response.json(JSON.parse(JSON.stringify(data)))
    return Response.json(JSON.parse(JSON.stringify(sanitizedData)))
  } catch (error) {
    console.error("[v0] Payables API error:", error)
    return Response.json({ error: "Failed to fetch payables data" }, { status: 500 })
  }
}
