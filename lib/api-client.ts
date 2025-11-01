// Client-side API utilities
export async function fetchERPData<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api/erp${endpoint}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export async function fetchProfitLoss(company: string, startDate: string, endDate: string) {
  return fetchERPData("/profit-loss", {
    company,
    startDate,
    endDate,
  })
}

export async function fetchBalanceSheet(company: string, startDate: string, endDate: string) {
  return fetchERPData("/balance-sheet", {
    company,
    startDate,
    endDate,
  })
}

export async function fetchCashFlow(company: string, startDate: string, endDate: string) {
  return fetchERPData("/cash-flow", {
    company,
    startDate,
    endDate,
  })
}

export async function fetchReceivables(company: string) {
  return fetchERPData("/receivables", { company })
}

export async function fetchPayables(company: string) {
  return fetchERPData("/payables", { company })
}

export async function fetchCompanies() {
  return fetchERPData("/companies")
}
