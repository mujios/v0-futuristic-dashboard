import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // Updated model reference

interface FinancialData {
  profitAndLoss?: unknown
  balanceSheet?: unknown
  cashFlow?: unknown
  receivables?: unknown
  payables?: unknown
}

export async function generateFinancialInsights(data: FinancialData, company: string): Promise<string> {
  try {
    const dataContext = JSON.stringify(data, null, 2)

    const prompt = `
You are a financial analyst AI assistant. Analyze the following ERPNext financial data for ${company}.

Provide a comprehensive financial analysis structured EXACTLY into the following five sections using markdown headers (##).

Financial Data:
${dataContext}

## KEY FINANCIAL METRICS SUMMARY
Provide a concise, 1-2 paragraph overview of profitability, liquidity, and solvency.

## RISK ALERTS
Provide 1-3 concise bullet points listing any concerning financial indicators or red flags.

## OPPORTUNITIES
Provide 1-3 concise bullet points listing high-level recommendations for improvement.

## TREND ANALYSIS
Provide 1-3 concise bullet points identifying important quantitative or qualitative changes compared to recent periods.

## ACTIONABLE INSIGHTS
Provide 1-3 specific next steps for management.
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1000,
      },
    })

    const text = result.response.text()
    // Return the full text, letting the client parse the headers (##)
    return text.trim()
  } catch (error) {
    console.error("[v0] Gemini financial insights error:", error)
    throw new Error("Failed to generate insights")
  }
}

export async function generateExecutiveSummary(data: FinancialData): Promise<string> {
  try {
    const dataContext = JSON.stringify(data, null, 2)

    const prompt = `
Create a brief executive summary (2-3 sentences) of the financial health based on this data:

${dataContext}

Be direct and focus on overall financial position.
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 200,
      },
    })

    return result.response.text()
  } catch (error) {
    console.error("[v0] Gemini executive summary error:", error)
    return "Unable to generate summary"
  }
}

export async function analyzeRevenueTrends(revenueData: Record<string, number>): Promise<string> {
  try {
    const prompt = `
Analyze these revenue trends and identify patterns:

${JSON.stringify(revenueData, null, 2)}

Provide insights on:
1. Growth rate
2. Seasonality patterns if any
3. Forecast for next period
Keep response concise.
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 300,
      },
    })

    return result.response.text()
  } catch (error) {
    console.error("[v0] Gemini revenue trend error:", error)
    return "Unable to analyze trends"
  }
}

export async function analyzeCashPosition(cashData: Record<string, number>): Promise<string> {
  try {
    const prompt = `
Analyze the cash flow position based on this data:

${JSON.stringify(cashData, null, 2)}

Provide insights on:
1. Cash burn rate or accumulation
2. Liquidity concerns
3. Recommendations for cash management
Keep response concise and actionable.
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 300,
      },
    })

    return result.response.text()
  } catch (error) {
    console.error("[v0] Gemini cash analysis error:", error)
    return "Unable to analyze cash position"
  }
}

export async function generateChatResponse(data: FinancialData, prompt: string, company: string): Promise<string> {
  try {
    const dataContext = JSON.stringify(data, null, 2)

    const systemPrompt = `You are a knowledgeable financial AI assistant for ${company}. 
You have access to the following financial data and should provide insightful, accurate, and actionable responses.

Financial Data Context:
${dataContext}

When answering questions:
1. Be specific and reference actual figures from the data when possible
2. Provide context and analysis, not just numbers
3. Suggest actionable recommendations when appropriate
4. Flag any concerning metrics or trends
5. Keep responses concise but comprehensive`

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    })

    return result.response.text()
  } catch (error) {
    console.error("[v0] Gemini chat error:", error)
    throw new Error("Failed to generate chat response")
  }
}
