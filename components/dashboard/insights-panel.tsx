"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertCircle, Zap } from "lucide-react"

interface InsightsPanelProps {
  insights?: string
}

const mockInsights = [
  {
    id: 1,
    type: "positive",
    icon: TrendingUp,
    title: "Revenue Growth",
    description: "Revenue increased by 15% compared to the previous quarter.",
  },
  {
    id: 2,
    type: "warning",
    icon: AlertCircle,
    title: "Cash Flow Alert",
    description: "Outstanding payables exceeded receivables by $50,000 this month.",
  },
  {
    id: 3,
    type: "insight",
    icon: Zap,
    title: "Efficiency Opportunity",
    description: "Optimizing inventory turnover could improve cash position by 8%.",
  },
]

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">AI-Powered Insights</CardTitle>
        <CardDescription className="text-slate-400">Powered by Google Gemini</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockInsights.map((insight) => {
            const Icon = insight.icon
            const typeColors = {
              positive: "bg-green-500/10 border-green-500/30 text-green-400",
              warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
              insight: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
            }

            return (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border flex gap-3 ${typeColors[insight.type as keyof typeof typeColors]}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <p className="text-sm opacity-75">{insight.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
