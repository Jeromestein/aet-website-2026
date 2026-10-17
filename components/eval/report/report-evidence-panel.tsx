"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/eval/ui/button"
import { ScrollArea } from "@/components/eval/ui/scroll-area"
import { Input } from "@/components/eval/ui/input"
import { cn } from "@/lib/eval/utils"
import type { SampleData, EvidenceItem } from "@/lib/eval/report-data"

type EvidencePanelProps = {
  data: SampleData
  onClose: () => void
}

type EvidenceFilter = "all" | "verified" | "needs_review"

const isVerified = (item: EvidenceItem) => {
  return Boolean(item.verifiedAt || item.source === "USER_VERIFIED" || item.source === "MANUAL")
}

const needsReview = (item: EvidenceItem) => {
  return item.confidence === "low" || item.refs.length === 0
}

const confidenceBadge = (confidence: EvidenceItem["confidence"]) => {
  switch (confidence) {
    case "high":
      return "bg-green-100 text-green-700"
    case "low":
      return "bg-amber-100 text-amber-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

const sourceBadge = (source: EvidenceItem["source"]) => {
  switch (source) {
    case "USER_VERIFIED":
      return "bg-emerald-100 text-emerald-700"
    case "AICE_RULES":
      return "bg-blue-100 text-blue-700"
    case "MANUAL":
      return "bg-indigo-100 text-indigo-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export function ReportEvidencePanel({ data, onClose }: EvidencePanelProps) {
  const [filter, setFilter] = useState<EvidenceFilter>("all")
  const [query, setQuery] = useState("")

  const evidenceItems = data.evidence || []

  const summary = useMemo(() => {
    const verifiedCount = evidenceItems.filter(isVerified).length
    const needsReviewCount = evidenceItems.filter(needsReview).length
    return {
      total: evidenceItems.length,
      verified: verifiedCount,
      needsReview: needsReviewCount,
    }
  }, [evidenceItems])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return evidenceItems.filter((item) => {
      if (filter === "verified" && !isVerified(item)) return false
      if (filter === "needs_review" && !needsReview(item)) return false
      if (!normalized) return true
      return (
        item.label.toLowerCase().includes(normalized) ||
        item.path.toLowerCase().includes(normalized) ||
        item.value.toLowerCase().includes(normalized)
      )
    })
  }, [evidenceItems, filter, query])

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Evidence Chain</h2>
          <p className="text-xs text-gray-500">
            Links report fields to source documents and verification status.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close evidence panel">
          <X size={18} />
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-semibold text-gray-900">{summary.total}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="text-xs text-gray-500">Verified</div>
            <div className="text-lg font-semibold text-emerald-700">{summary.verified}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="text-xs text-gray-500">Needs Review</div>
            <div className="text-lg font-semibold text-amber-700">{summary.needsReview}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setFilter("all")}
          >
            <ShieldCheck size={14} />
            All
          </Button>
          <Button
            variant={filter === "verified" ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setFilter("verified")}
          >
            <CheckCircle2 size={14} />
            Verified
          </Button>
          <Button
            variant={filter === "needs_review" ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setFilter("needs_review")}
          >
            <AlertTriangle size={14} />
            Needs Review
          </Button>
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by field, path, or value"
          className="text-sm"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            No evidence entries match your filters.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredItems.map((item) => {
              const verified = isVerified(item)
              return (
                <div key={item.id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.path}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", confidenceBadge(item.confidence))}>
                        {item.confidence.toUpperCase()}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", sourceBadge(item.source))}>
                        {item.source.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-800">{item.value || "—"}</div>

                  {item.notes && (
                    <div className="mt-2 text-xs text-gray-500">{item.notes}</div>
                  )}

                  <div className="mt-3 flex flex-col gap-2">
                    {item.refs.length === 0 ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        No source references linked yet.
                      </div>
                    ) : (
                      item.refs.map((ref, index) => (
                        <div key={`${item.id}-ref-${index}`} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">{ref.docId || "Document"}</span>
                            <span>Page {ref.page || "?"}</span>
                          </div>
                          {ref.quote && (
                            <div className="mt-1 italic text-gray-700">"{ref.quote}"</div>
                          )}
                          <div className="mt-1 text-[11px] text-gray-500">
                            Method: {ref.method}
                            {ref.extractor ? ` • ${ref.extractor}` : ""}
                            {ref.extractedAt ? ` • ${ref.extractedAt}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={cn(
                    "mt-3 rounded-md px-3 py-2 text-xs font-medium",
                    verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {verified
                      ? `Verified${item.verifiedAt ? ` on ${item.verifiedAt}` : ""}`
                      : "Not verified yet"}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
