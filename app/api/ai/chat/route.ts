import { generateChatResponse } from "@/lib/gemini-client"

export async function POST(request: Request) {
  try {
    const { prompt, financialData, company } = await request.json()

    if (!prompt || !financialData) {
      return Response.json({ error: "Missing prompt or financial data" }, { status: 400 })
    }

    const response = await generateChatResponse(financialData, prompt, company)

    return Response.json({ response })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
