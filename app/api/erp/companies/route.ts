import { getERPClient } from "@/lib/erp-client"

export async function GET() {
  try {
    const client = await getERPClient()
    const data = await client.getCompanies()

    // FIX: Ensure data is not undefined/null before sanitizing and returning.
    const sanitizedData = data === undefined || data === null ? {} : data;

    // The previous fix: return Response.json(JSON.parse(JSON.stringify(data)))
    return Response.json(JSON.parse(JSON.stringify(sanitizedData)))
  } catch (error) {
    console.error("[v0] Companies API error:", error)
    return Response.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}
