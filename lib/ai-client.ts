// Client-side AI utilities

export async function fetchInsights(company: string, startDate: string, endDate: string): Promise<string> {
  const response = await fetch("/api/ai/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, startDate, endDate }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch insights")
  }

  const data = await response.json()
  return data.insights
}

export async function fetchExecutiveSummary(company: string, startDate: string, endDate: string): Promise<string> {
  const response = await fetch("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, startDate, endDate }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch summary")
  }

  const data = await response.json()
  return data.summary
}
