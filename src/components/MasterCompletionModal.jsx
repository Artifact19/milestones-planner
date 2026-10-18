import { useEffect } from 'react'
import { CheckCircle2, History, CheckCheck, X, Sparkles } from 'lucide-react'
import { DAY_NAMES } from '../utils/dateUtils'

const DAY_LETTERS = ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function MasterCompletionModal({
  isOpen,
  onClose,
  task,
  subTasks = [],
  onPreserveHistory,
  onCompleteAll
}) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  const completedCount = subTasks.filter((s) => s.is_completed).length
  const totalCount = subTasks.length
  const incompleteCount = totalCount - completedCount

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(28,25,23,0.15)] space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF2EC] border border-[#CFE1D3] text-[#224A32] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-[#1C1917] tracking-tight">
                Milestone Achieved!
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Weekly master goal completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-stone-400 hover:text-[#1C1917] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Milestone Callout */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 space-y-2.5">
          <div className="text-xs text-[#78716C] font-medium">Task:</div>
          <div className="font-semibold text-sm text-[#1C1917] break-words">
            {task.title}
          </div>

          {/* Daily sessions progress status */}
          <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between text-xs">
            <span className="text-[#78716C]">
              {completedCount} of {totalCount} daily sessions logged
            </span>
            <span className="font-mono font-bold text-[#224A32]">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>

          {/* Mini Segmented Days Indicator */}
          <div className="flex items-center gap-1.5 pt-1">
            {subTasks.map((st) => (
              <span
                key={st.id}
                title={`${DAY_NAMES[st.day_of_week]}: ${st.is_completed ? 'Completed' : 'Not completed'}`}
                className={`flex-1 text-center py-1 text-[10px] font-bold rounded-lg border transition-all ${
                  st.is_completed
                    ? 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32]'
                    : 'bg-white border-[#E5E0D8] text-stone-400'
                }`}
              >
                {DAY_LETTERS[st.day_of_week]} {st.is_completed ? '✓' : '·'}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#57534E] leading-relaxed">
          You still have <strong>{incompleteCount} daily session{incompleteCount === 1 ? '' : 's'}</strong> not marked done. How would you like to record this milestone?
        </p>

        {/* Action Options */}
        <div className="space-y-2.5 pt-1">
          {/* Option A (Recommended): Preserve Daily History */}
          <button
            type="button"
            onClick={onPreserveHistory}
            className="w-full text-left p-3.5 rounded-2xl bg-[#1C1917] hover:bg-black text-white transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#A8B5A0]" />
                <span className="text-sm font-semibold text-white">
                  Preserve Daily History
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                Recommended
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1.5 leading-relaxed pl-6">
              Complete this weekly milestone, but keep your daily logs accurate to the sessions you actually completed.
            </p>
          </button>

          {/* Option B: Mark All Days Done */}
          <button
            type="button"
            onClick={onCompleteAll}
            className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#1C1917] transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-[#224A32]" />
              <span className="text-sm font-semibold text-[#1C1917]">
                Mark All Days Done
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed pl-6">
              Mark this milestone and all remaining {incompleteCount} daily session{incompleteCount === 1 ? '' : 's'} as finished too.
            </p>
          </button>
        </div>

        {/* Bottom Cancel */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#78716C] hover:text-[#1C1917] font-medium py-1 px-3 cursor-pointer transition-colors"
          >
            Cancel (keep milestone pending)
          </button>
        </div>
      </div>
    </div>
  )
}
