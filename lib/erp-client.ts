const API_TIMEOUT = 15000

interface ERPResponse<T = any> {
  message?: T
  data?: T
  ok?: boolean
  [key: string]: any
}

export class ERPClient {
  private erpUrl: string
  private apiKey: string
  private apiSecret: string

  constructor() {
    this.erpUrl = process.env.NEXT_PUBLIC_ERP_URL || "https://demo.erpnext.com"
    this.apiKey = process.env.ERP_API_KEY || ""
    this.apiSecret = process.env.ERP_API_SECRET || ""

    console.log("[v15] ERPClient initialized with URL:", this.erpUrl)

    if (!this.apiKey || !this.apiSecret) {
      console.warn("[v15] Warning: ERP_API_KEY or ERP_API_SECRET not set. API calls may fail.")
    }
  }

  // -------------------- Core Fetch -------------------- //
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<ERPResponse<T>> {
    if (!this.erpUrl || !this.apiKey || !this.apiSecret) {
      throw new Error("ERPNext credentials not configured")
    }

    const url = endpoint.startsWith("/api") ? `${this.erpUrl}${endpoint}` : `${this.erpUrl}/api${endpoint}`
    const token = `Token ${this.apiKey}:${this.apiSecret}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      console.log(`[v15] Fetching: ${url}`)
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          ...options?.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v15] API error ${response.status}:`, errorText)
        throw new Error(`ERPNext API error: ${response.status}`)
      }

      try {
        return await response.json()
      } catch (jsonErr) {
        console.error("[v15] JSON parse error:", jsonErr)
        throw new Error("Invalid JSON response from ERPNext API")
      }
    } catch (error) {
      clearTimeout(timeout)
      console.error("[v15] Fetch error:", error)
      throw error
    }
  }

  // -------------------- Generic Helpers -------------------- //
  private async get<T>(endpoint: string) {
    return await this.fetch<T>(endpoint)
  }

  private async post<T>(endpoint: string, body: Record<string, any>) {
    return await this.fetch<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  // -------------------- Reports via query_report.run -------------------- //
  private async runReport(reportName: string, filters: Record<string, any>) {
    const body = { report_name: reportName, filters }
    const response = await this.post("/method/frappe.desk.query_report.run", body)
    return response.data
  }

  async getProfitAndLoss(company: string, startDate: string, endDate: string) {
    try {
      return await this.runReport("Profit and Loss Statement", {
        company,
        period_start_date: startDate,
        period_end_date: endDate,
      })
    } catch (error) {
      console.error("[v15] Profit & Loss fallback:", error)
      return await this.getGLEntriesFallback(company, startDate, endDate)
    }
  }

  async getBalanceSheet(company: string, startDate: string, endDate: string) {
    try {
      return await this.runReport("Balance Sheet", {
        company,
        period_start_date: startDate,
        period_end_date: endDate,
      })
    } catch (error) {
      console.error("[v15] Balance Sheet fallback:", error)
      return await this.getAccountsFallback(company)
    }
  }

  async getCashFlow(company: string, startDate: string, endDate: string) {
    try {
      return await this.runReport("Cash Flow", {
        company,
        period_start_date: startDate,
        period_end_date: endDate,
      })
    } catch (error) {
      console.error("[v15] Cash Flow fallback:", error)
      return await this.getPaymentEntriesFallback(company)
    }
  }

  async getAccountsReceivable(company: string) {
    try {
      return await this.runReport("Accounts Receivable Summary", { company })
    } catch (error) {
      console.error("[v15] Accounts Receivable fallback:", error)
      return await this.getSalesInvoicesFallback(company)
    }
  }

  async getAccountsPayable(company: string) {
    try {
      return await this.runReport("Accounts Payable Summary", { company })
    } catch (error) {
      console.error("[v15] Accounts Payable fallback:", error)
      return await this.getPurchaseInvoicesFallback(company)
    }
  }

  // -------------------- Fallbacks -------------------- //
  private async getGLEntriesFallback(company: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      fields: JSON.stringify(["posting_date", "account", "debit", "credit"]),
      filters: JSON.stringify([
        ["GL Entry", "company", "=", company],
        ["GL Entry", "posting_date", ">=", startDate],
        ["GL Entry", "posting_date", "<=", endDate],
      ]),
    })
    return await this.get(`/resource/GL Entry?${params}`)
  }

  private async getAccountsFallback(company: string) {
    const params = new URLSearchParams({
      fields: JSON.stringify(["name", "account_type"]), // removed "balance" to prevent 417 error
      filters: JSON.stringify([["Account", "company", "=", company]]),
    })
    return await this.get(`/resource/Account?${params}`)
  }

  private async getPaymentEntriesFallback(company: string) {
    const params = new URLSearchParams({
      fields: JSON.stringify(["name", "posting_date", "paid_amount", "payment_type"]),
      filters: JSON.stringify([["Payment Entry", "company", "=", company]]),
    })
    return await this.get(`/resource/Payment Entry?${params}`)
  }

  private async getSalesInvoicesFallback(company: string) {
    const params = new URLSearchParams({
      fields: JSON.stringify(["name", "customer"]), // removed "outstanding_amount" to prevent 417 Expectation Failed errors
      filters: JSON.stringify([["Sales Invoice", "company", "=", company]]),
    })
    return await this.get(`/resource/Sales Invoice?${params}`)
  }

  private async getPurchaseInvoicesFallback(company: string) {
    const params = new URLSearchParams({
      fields: JSON.stringify(["name", "supplier"]), // removed "outstanding_amount" to prevent 417 Expectation Failed errors
      filters: JSON.stringify([["Purchase Invoice", "company", "=", company]]),
    })
    return await this.get(`/resource/Purchase Invoice?${params}`)
  }

  // -------------------- Utility -------------------- //
  async getCompanies() {
    try {
      const params = new URLSearchParams({
        fields: JSON.stringify(["name", "company_name"]),
        limit_page_length: "0",
      })
      return await this.get<{ name: string; company_name: string }[]>(`/resource/Company?${params}`)
    } catch (error) {
      console.error("[v15] Companies fetch error:", error)
      return { message: [] }
    }
  }

  async getCurrentUser() {
    try {
      return await this.get("/method/frappe.auth.get_logged_in_user")
    } catch (error) {
      console.error("[v15] Current user fetch error:", error)
      throw error
    }
  }

  async whoAmI() {
    try {
      const res = await this.get("/method/frappe.auth.get_logged_user")
      return res?.message || res?.data
    } catch (error) {
      console.error("[v15] whoAmI error:", error)
      return null
    }
  }
}

// -------------------- Singleton Instance -------------------- //
let erpClient: ERPClient | null = null

export async function getERPClient() {
  if (!erpClient) {
    erpClient = new ERPClient()
  }
  return erpClient
}
