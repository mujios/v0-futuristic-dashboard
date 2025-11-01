"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertCircle, Zap, MessageSquare, Shield, Activity } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface InsightItem {
  id: number
  type: "positive" | "warning" | "insight" | "summary" | "trend"
  icon: LucideIcon
  title: string
  description: string
}

interface InsightsPanelProps {
  insights?: string | null
}

// Maps the internal AI section title to the client-side InsightItem structure
const SECTION_MAPPINGS: { [key: string]: Pick<InsightItem, 'title' | 'type' | 'icon'> } = {
  "KEY FINANCIAL METRICS SUMMARY": { title: "Executive Summary", type: "summary", icon: Activity },
  "RISK ALERTS": { title: "Risk Alerts", type: "warning", icon: AlertCircle },
  "OPPORTUNITIES": { title: "Opportunities", type: "positive", icon: TrendingUp },
  "TREND ANALYSIS": { title: "Key Trends", type: "trend", icon: Zap },
  "ACTIONABLE INSIGHTS": { title: "Actionable Next Steps", type: "insight", icon: MessageSquare },
};

/**
 * Parses the structured text output from the Gemini API into an array of InsightItem objects.
 * It expects the AI output to be segmented by '## SECTION TITLE'.
 */
function parseInsights(insightText: string): InsightItem[] {
  if (!insightText) return [];

  // Split the text block by the markdown header '## ' to separate sections
  const tokens = insightText.trim().split(/##\/**\s+/).map(s => s.trim()).filter(s => s.length > 0);
  
  const results: InsightItem[] = [];
  let currentId = 1;

  tokens.forEach(token => {
    // Try to find the section title (the first line of the token)
    const titleMatch = token.match(/^([^\n]+)/);
    if (!titleMatch) return; 

    const rawTitle = titleMatch[1].trim();
    const sectionConfig = SECTION_MAPPINGS[rawTitle];

    if (sectionConfig) {
        // Extract the description by removing the title and trimming whitespace
        const description = token.replace(rawTitle, '').trim();

        results.push({
            id: currentId++,
            ...sectionConfig,
            description: description || "No detailed information available for this section.",
        });
    }
  });

  // Fallback for unexpected or empty output
  if (results.length === 0 && insightText.length > 0) {
    results.push({
      id: 1,
      type: "warning",
      icon: AlertCircle,
      title: "AI Output Unstructured",
      description: "The AI did not return data in the expected format. Please check the API response for errors or unexpected output.",
    })
  }

  return results;
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const insightItems = parseInsights(insights || "");

  // Show loading state if insights is null (initial load)
  if (insights === null) {
      // Return a loading state or default message
      return (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">AI-Powered Insights</CardTitle>
            <CardDescription className="text-slate-400">Powered by Google Gemini</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="p-4 rounded-lg border flex gap-3 bg-blue-500/10 border-blue-500/30 text-blue-400">
                <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Awaiting Analysis</h4>
                  <p className="text-sm opacity-75">Financial data is loading. AI analysis will begin shortly.</p>
                </div>
            </div>
          </CardContent>
        </Card>
      )
  }

  // Use parsed insights
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">AI-Powered Insights</CardTitle>
        <CardDescription className="text-slate-400">Powered by Google Gemini</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insightItems.map((insight) => {
            const Icon = insight.icon
            const typeColors = {
              positive: "bg-green-500/10 border-green-500/30 text-green-400",
              warning: "bg-red-500/10 border-red-500/30 text-red-400", // Using red for warnings/risks
              insight: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
              summary: "bg-blue-500/10 border-blue-500/30 text-blue-400",
              trend: "bg-purple-500/10 border-purple-500/30 text-purple-400",
            }
            
            // Split by newline and wrap each line in a paragraph tag for clean rendering.
            // This also handles markdown bullet points that the AI might return.
            const lines = insight.description.split('\n');
            const formattedDescription = lines.map((line, index) => {
              const trimmedLine = line.trim();
              if (trimmedLine.length === 0) return null; // Skip empty lines
              
              // Simple cleanup for markdown list items (optional: replace * or - with •)
              const cleanedLine = trimmedLine.replace(/^[*•-]\s*/, '• ');
              
              return <p key={index} className="text-sm opacity-75">{cleanedLine}</p>;
            });

            return (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border flex gap-3 ${typeColors[insight.type] || typeColors.insight}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                  <div>{formattedDescription}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
