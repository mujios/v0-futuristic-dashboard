"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { exportAsCSV, exportAsJSON, exportAsPDF, type ExportData } from "@/lib/export"
import { FileJson, FileText, Download, FileCode } from "lucide-react"
import { useState } from "react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ExportData
}

export default function ExportDialog({ open, onOpenChange, data }: ExportDialogProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    setExporting(format)
    try {
      if (format === "json") {
        exportAsJSON(data)
      } else if (format === "csv") {
        exportAsCSV(data)
      } else if (format === "pdf") {
        exportAsPDF(data)
      }
      onOpenChange(false)
    } finally {
      setExporting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-700 bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">Export Report</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose a format to export your financial report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={() => handleExport("json")}
            disabled={exporting === "json"}
            className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <FileJson className="h-5 w-5" />
            <div className="text-left flex-1">
              <div className="font-medium">JSON Format</div>
              <div className="text-xs opacity-75">For integration with other systems</div>
            </div>
            <Download className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => handleExport("csv")}
            disabled={exporting === "csv"}
            className="w-full justify-start gap-3 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
          >
            <FileText className="h-5 w-5" />
            <div className="text-left flex-1">
              <div className="font-medium">CSV Format</div>
              <div className="text-xs opacity-75">For spreadsheet applications</div>
            </div>
            <Download className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => handleExport("pdf")}
            disabled={exporting === "pdf"}
            className="w-full justify-start gap-3 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
          >
            <FileCode className="h-5 w-5" />
            <div className="text-left flex-1">
              <div className="font-medium">Text Format</div>
              <div className="text-xs opacity-75">Plain text report for all systems</div>
            </div>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-400">
          <p>
            Report includes: Profit & Loss, Balance Sheet, Cash Flow, Receivables, Payables, and AI Insights for{" "}
            <span className="text-slate-200 font-medium">{data.company}</span> ({data.dateRange.start} to{" "}
            {data.dateRange.end})
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
