import { getERPClient } from "@/lib/erp-client"

export async function GET() {
  try {
    const client = await getERPClient()
    const companies = await client.getCompanies()
    console.log("[v0] Companies fetched:", companies)

    return Response.json(companies || [])
  } catch (error) {
    console.error("[v0] Companies API error:", error)
    return Response.json([], { status: 500 })
  }
}
