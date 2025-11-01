import { getERPClient } from "@/lib/erp-client"

export async function GET() {
  try {
    const client = await getERPClient()
    const data = await client.getCompanies()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Companies API error:", error)
    return Response.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}
