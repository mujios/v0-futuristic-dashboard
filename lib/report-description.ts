import type { ReportId } from "@/components/dashboard/sidebar"

export function getReportDescription(id: ReportId): string {
  const descriptions: Record<ReportId, string> = {
    overview: "Complete financial overview and key metrics",
    pl: "Revenue, expenses, and profit analysis",
    balance: "Assets, liabilities, and equity snapshot",
    cashflow: "Cash inflows and outflows tracking",
    receivables: "Customer payment aging analysis",
    payables: "Vendor payment aging analysis",
    insights: "AI-powered financial insights",
  }
  return descriptions[id]
}
