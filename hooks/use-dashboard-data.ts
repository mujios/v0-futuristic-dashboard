"use client"

import { useCallback, useRef, useState } from "react"
import { fetchProfitLoss, fetchBalanceSheet, fetchCashFlow, fetchReceivables, fetchPayables } from "@/lib/api-client"
import { fetchInsights } from "@/lib/ai-client"

interface DashboardData {
  profitAndLoss: unknown | null
  balanceSheet: unknown | null
  cashFlow: unknown | null
  receivables: unknown | null
  payables: unknown | null
  insights: string | null
}

/**
 * Production-grade dashboard data hook
 * Implements state machine: Idle → Ready → Fetching → Data Loaded → Stable
 * NO auto-fetch: Only fetch on explicit button click
 * NO continuous polling: Single fetch cycle per user action
 * AI insights trigger ONCE after all reports loaded
 */
export function useDashboardData(company: string, startDate: string, endDate: string) {
  const [data, setData] = useState<DashboardData>({
    profitAndLoss: null,
    balanceSheet: null,
    cashFlow: null,
    receivables: null,
    payables: null,
    insights: null,
  })
  const [loading, setLoading] = useState(false) // Changed to false - no auto-fetch
  const [error, setError] = useState<string | null>(null)
  const lastFetchRef = useRef<number>(0)
  const isFetchingRef = useRef(false) // Prevent concurrent fetches

  const fetchData = useCallback(async () => {
    // Validation: all filters required
    if (!company || !startDate || !endDate) {
      setError("Missing company or date range")
      return
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.warn("[v0] Fetch already in progress, ignoring duplicate request")
      return
    }

    isFetchingRef.current = true
    setLoading(true)
    setError(null)
    lastFetchRef.current = Date.now()

    try {
      console.log(`[v0] Fetching reports for ${company} (${startDate} to ${endDate})`)

      // Fetch all reports in parallel - NO AI INSIGHTS YET
      const [pl, bs, cf, ar, ap] = await Promise.allSettled([
        fetchProfitLoss(company, startDate, endDate),
        fetchBalanceSheet(company, startDate, endDate),
        fetchCashFlow(company, startDate, endDate),
        fetchReceivables(company),
        fetchPayables(company),
      ])

      const reportData = {
        profitAndLoss: pl.status === "fulfilled" ? pl.value : null,
        balanceSheet: bs.status === "fulfilled" ? bs.value : null,
        cashFlow: cf.status === "fulfilled" ? cf.value : null,
        receivables: ar.status === "fulfilled" ? ar.value : null,
        payables: ap.status === "fulfilled" ? ap.value : null,
      }

      // All reports loaded - NOW trigger AI insights ONCE
      console.log("[v0] All reports loaded, generating AI insights once...")
      let insightsText = null
      try {
        insightsText = await fetchInsights(company, startDate, endDate)
      } catch (insightErr) {
        console.warn("[v0] AI insights generation failed, continuing without", insightErr)
        // Don't fail the entire fetch if insights fail
      }

      setData({
        ...reportData,
        insights: insightsText,
      })

      console.log("[v0] Dashboard data loaded successfully")
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data"
      console.error("[v0] Dashboard fetch error:", errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [company, startDate, endDate])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    lastFetch: lastFetchRef.current,
  }
}
