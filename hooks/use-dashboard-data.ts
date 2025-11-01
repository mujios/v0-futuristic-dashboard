"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

export function useDashboardData(company: string, startDate: string, endDate: string) {
  const [data, setData] = useState<DashboardData>({
    profitAndLoss: null,
    balanceSheet: null,
    cashFlow: null,
    receivables: null,
    payables: null,
    insights: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(0)

  const fetchData = useCallback(async () => {
    if (!company) return

    setLoading(true)
    setError(null)
    lastRefreshRef.current = Date.now()

    try {
      const [pl, bs, cf, ar, ap, insights] = await Promise.allSettled([
        fetchProfitLoss(company, startDate, endDate),
        fetchBalanceSheet(company, startDate, endDate),
        fetchCashFlow(company, startDate, endDate),
        fetchReceivables(company),
        fetchPayables(company),
        fetchInsights(company, startDate, endDate),
      ])

      setData({
        profitAndLoss: pl.status === "fulfilled" ? pl.value : null,
        balanceSheet: bs.status === "fulfilled" ? bs.value : null,
        cashFlow: cf.status === "fulfilled" ? cf.value : null,
        receivables: ar.status === "fulfilled" ? ar.value : null,
        payables: ap.status === "fulfilled" ? ap.value : null,
        insights: insights.status === "fulfilled" ? insights.value : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [company, startDate, endDate])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    refreshIntervalRef.current = setInterval(
      () => {
        fetchData()
      },
      5 * 60 * 1000,
    )

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [fetchData])

  const manualRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh: manualRefresh,
    lastRefresh: lastRefreshRef.current,
  }
}
