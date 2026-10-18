import { useEffect, useRef } from 'react'
import { useWeeklyNote } from '../hooks/useWeeklyNote'
import { Sparkles, Check, Loader2, AlertCircle } from 'lucide-react'

export default function SundayCard({ weekStart }) {
  const { note, updateNote, saveStatus, loading } = useWeeklyNote(weekStart)
  const textareaRef = useRef(null)

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(96, textareaRef.current.scrollHeight)}px`
    }
  }, [note])

  return (
    <div className="bg-white/90 border border-[#E5E0D8] rounded-3xl p-6 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-[#E5E0D8]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#695431]" />
            <h2 className="font-semibold text-[#1C1917] tracking-tight">
              Sunday Reflection & Architecture
            </h2>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Optional. Capture high-level notes, what worked this week, and priorities for next week.
          </p>
        </div>

        {/* Save Status Badge */}
        <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto font-medium">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[#78716C]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1C1917]" />
              <span>Saving…</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[#224A32] font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Saved to cloud</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-[#9E362A] font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Save failed</span>
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center text-xs text-[#A8A29E]">
          Loading reflection note…
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => updateNote(e.target.value)}
          placeholder="What went well this week? What are your top priorities for next week?"
          rows={3}
          className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#1C1917] focus:bg-white rounded-2xl p-4 text-sm text-[#1C1917] placeholder-stone-400 focus:outline-none resize-none transition-all leading-relaxed font-sans"
        />
      )}
    </div>
  )
}
