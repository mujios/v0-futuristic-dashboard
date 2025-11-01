import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

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
You are a financial analyst AI assistant. Analyze the following ERPNext financial data for ${company} and provide:

1. KEY FINANCIAL METRICS SUMMARY - Overview of profitability, liquidity, and solvency
2. TREND ANALYSIS - Important changes compared to recent periods
3. RISK ALERTS - Any concerning financial indicators or red flags
4. OPPORTUNITIES - Recommendations for improvement
5. ACTIONABLE INSIGHTS - Specific next steps for management

Financial Data:
${dataContext}

Format your response in clear sections with bullet points where appropriate. Be concise but comprehensive. Focus on insights that drive business decisions.
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    })

    const text = result.response.text()
    return text
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
