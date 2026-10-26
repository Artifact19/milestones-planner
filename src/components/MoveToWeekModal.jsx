import { useState, useMemo } from 'react'
import {
  X,
  Calendar,
  ArrowRight,
  CalendarDays,
  Clock,
  Sparkles,
  Briefcase,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Repeat
} from 'lucide-react'
import {
  getMonday,
  addWeeks,
  formatWeekRange,
  toDateString,
  TAG_OPTIONS,
  formatDuration
} from '../utils/dateUtils'

export default function MoveToWeekModal({
  isOpen,
  onClose,
  tasks = [], // array of tasks to copy / carry forward
  currentWeekStart,
  onCopyMilestones // (tasks, targetWeekMonday, selectedDays, shouldNavigate) => Promise<void>
}) {
  const taskList = Array.isArray(tasks) ? tasks : tasks ? [tasks] : []
  const isMultiple = taskList.length > 1
  const primaryTask = taskList[0]

  // Default target is next week
  const nextWeekMonday = useMemo(() => addWeeks(currentWeekStart, 1), [currentWeekStart])
  const twoWeeksMonday = useMemo(() => addWeeks(currentWeekStart, 2), [currentWeekStart])
  const prevWeekMonday = useMemo(() => addWeeks(currentWeekStart, -1), [currentWeekStart])

  // Selected target week: 'next' | 'two-weeks' | 'prev' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState('next')
  const [customDate, setCustomDate] = useState(() => toDateString(nextWeekMonday))

  // Schedule pattern: 'mon-sat' (Default: Master + Mon-Sat) | 'weekly-only' | 'custom'
  const [schedulePattern, setSchedulePattern] = useState('mon-sat')
  // Interactive custom days: [0: Wk, 1: Mon, ..., 6: Sat, 7: Sun]
  const [customDays, setCustomDays] = useState([0, 1, 2, 3, 4, 5, 6])

  const [navigateToTarget, setNavigateToTarget] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate actual target Monday date
  const targetWeekMonday = useMemo(() => {
    if (selectedPreset === 'next') return nextWeekMonday
    if (selectedPreset === 'two-weeks') return twoWeeksMonday
    if (selectedPreset === 'prev') return prevWeekMonday
    if (customDate) {
      const [y, m, d] = customDate.split('-').map(Number)
      if (y && m && d) {
        return getMonday(new Date(y, m - 1, d))
      }
    }
    return nextWeekMonday
  }, [selectedPreset, customDate, nextWeekMonday, twoWeeksMonday, prevWeekMonday])

  // Effective days array to schedule in target week
  const effectiveDays = useMemo(() => {
    if (schedulePattern === 'mon-sat') {
      return [0, 1, 2, 3, 4, 5, 6] // Weekly Master + Mon to Sat
    }
    if (schedulePattern === 'weekly-only') {
      return [0] // Weekly List only
    }
    return customDays.length > 0 ? customDays : [0]
  }, [schedulePattern, customDays])

  if (!isOpen || taskList.length === 0) return null

  const targetWeekRange = formatWeekRange(targetWeekMonday)
  const currentWeekRange = formatWeekRange(currentWeekStart)

  const toggleCustomDay = (d) => {
    setCustomDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== d)
      }
      return [...prev, d].sort((a, b) => a - b)
    })
  }

  const handleConfirm = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCopyMilestones(taskList, targetWeekMonday, effectiveDays, navigateToTarget)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const tagObj = primaryTask
    ? TAG_OPTIONS.find((t) => t.id === (primaryTask.tag || 'career')) || TAG_OPTIONS[0]
    : TAG_OPTIONS[0]

  const dayButtons = [
    { num: 0, label: 'Wk', name: 'Weekly Master' },
    { num: 1, label: 'Mon', name: 'Monday' },
    { num: 2, label: 'Tue', name: 'Tuesday' },
    { num: 3, label: 'Wed', name: 'Wednesday' },
    { num: 4, label: 'Thu', name: 'Thursday' },
    { num: 5, label: 'Fri', name: 'Friday' },
    { num: 6, label: 'Sat', name: 'Saturday' },
    { num: 7, label: 'Sun', name: 'Sunday' }
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-week-modal-title"
    >
      <div
        className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(28,25,23,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1C1917] text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5 text-stone-200" />
            </div>
            <div>
              <h2 id="move-week-modal-title" className="font-bold text-[#1C1917] text-base tracking-tight font-sans">
                {isMultiple ? `Carry ${taskList.length} Milestones to Next Week` : 'Carry Milestone to Next Week'}
              </h2>
              <p className="text-xs text-[#78716C]">
                Copy into destination week with daily schedule (Mon–Sat)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-stone-100 text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto font-sans">
          {/* Target Task Summary Card */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#E5E0D8] shadow-2xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block">
              {isMultiple ? 'Milestones to Carry Forward:' : 'Selected Milestone:'}
            </span>

            {isMultiple ? (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {taskList.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs text-[#1C1917]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#224A32] shrink-0" />
                    <span className="font-semibold truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-sm text-[#1C1917] truncate">
                  {primaryTask.title}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 text-xs">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tagObj.badgeClass}`}>
                    {tagObj.id === 'career' && <Briefcase className="w-3 h-3" />}
                    {tagObj.id === 'college' && <BookOpen className="w-3 h-3" />}
                    {tagObj.id === 'personal' && <Sparkles className="w-3 h-3" />}
                    <span>{tagObj.shortLabel}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E]">
                    <Clock className="w-3 h-3 text-[#224A32]" />
                    <span>{formatDuration(primaryTask.duration_minutes ?? 30)} / daily session</span>
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E5E0D8]/60 flex items-center justify-between gap-1.5 text-[11px] text-[#78716C]">
              <span>Current Cycle: <strong className="text-[#1C1917] font-semibold">{currentWeekRange}</strong></span>
              <span className="text-[#224A32] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                History stays intact
              </span>
            </div>
          </div>

          {/* Destination Week Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#78716C] block">
              1. Choose Destination Week:
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Next Week */}
              <button
                type="button"
                onClick={() => setSelectedPreset('next')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedPreset === 'next'
                    ? 'bg-[#1C1917] border-[#1C1917] text-white shadow-xs'
                    : 'bg-white hover:bg-stone-50 border-[#E5E0D8] text-[#1C1917]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">🚀 Next Week</span>
                  {selectedPreset === 'next' && <CheckCircle2 className="w-3.5 h-3.5 text-stone-300" />}
                </div>
                <span className={`text-[11px] truncate font-medium ${selectedPreset === 'next' ? 'text-stone-300' : 'text-[#78716C]'}`}>
                  {formatWeekRange(nextWeekMonday)}
                </span>
              </button>

              {/* In 2 Weeks */}
              <button
                type="button"
                onClick={() => setSelectedPreset('two-weeks')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedPreset === 'two-weeks'
                    ? 'bg-[#1C1917] border-[#1C1917] text-white shadow-xs'
                    : 'bg-white hover:bg-stone-50 border-[#E5E0D8] text-[#1C1917]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">🗓️ In 2 Weeks</span>
                  {selectedPreset === 'two-weeks' && <CheckCircle2 className="w-3.5 h-3.5 text-stone-300" />}
                </div>
                <span className={`text-[11px] truncate font-medium ${selectedPreset === 'two-weeks' ? 'text-stone-300' : 'text-[#78716C]'}`}>
                  {formatWeekRange(twoWeeksMonday)}
                </span>
              </button>

              {/* Previous Week */}
              <button
                type="button"
                onClick={() => setSelectedPreset('prev')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedPreset === 'prev'
                    ? 'bg-[#1C1917] border-[#1C1917] text-white shadow-xs'
                    : 'bg-white hover:bg-stone-50 border-[#E5E0D8] text-[#1C1917]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">⏪ Previous Week</span>
                  {selectedPreset === 'prev' && <CheckCircle2 className="w-3.5 h-3.5 text-stone-300" />}
                </div>
                <span className={`text-[11px] truncate font-medium ${selectedPreset === 'prev' ? 'text-stone-300' : 'text-[#78716C]'}`}>
                  {formatWeekRange(prevWeekMonday)}
                </span>
              </button>
            </div>

            {/* Custom Date / Specific Week Picker */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                selectedPreset === 'custom'
                  ? 'bg-white border-[#1C1917] shadow-xs'
                  : 'bg-white/70 border-[#E5E0D8] hover:border-stone-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label
                  onClick={() => setSelectedPreset('custom')}
                  className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="week-preset"
                    checked={selectedPreset === 'custom'}
                    onChange={() => setSelectedPreset('custom')}
                    className="accent-[#1C1917] cursor-pointer"
                  />
                  <span>Select any specific date or week:</span>
                </label>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#78716C]" />
                  <input
                    type="date"
                    value={customDate}
                    onFocus={() => setSelectedPreset('custom')}
                    onChange={(e) => {
                      setCustomDate(e.target.value)
                      setSelectedPreset('custom')
                    }}
                    className="bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#1C1917] rounded-xl px-2.5 py-1 text-xs text-[#1C1917] font-sans focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {selectedPreset === 'custom' && (
                <p className="text-[11px] text-[#224A32] font-medium mt-2 pl-5 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-[#224A32]" />
                  Target cycle: <strong className="font-bold">{targetWeekRange}</strong>
                </p>
              )}
            </div>
          </div>

          {/* 2. Destination Days Schedule Pattern */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#78716C] block">
              2. Schedule Days in Target Week:
            </label>

            <div className="space-y-2">
              {/* Option A: Master + Monday to Saturday (Recommended & Default) */}
              <label
                onClick={() => setSchedulePattern('mon-sat')}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  schedulePattern === 'mon-sat'
                    ? 'bg-white border-[#1C1917] shadow-xs'
                    : 'bg-white/70 border-[#E5E0D8] hover:border-stone-400'
                }`}
              >
                <input
                  type="radio"
                  name="schedule-pattern"
                  checked={schedulePattern === 'mon-sat'}
                  onChange={() => setSchedulePattern('mon-sat')}
                  className="mt-0.5 accent-[#1C1917] cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1C1917]">
                      ✨ Weekly Master + Monday to Saturday (Mon–Sat)
                    </span>
                    <span className="text-[10px] font-semibold bg-[#EBF2EC] text-[#224A32] border border-[#CFE1D3] px-2 py-0.2 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C] leading-relaxed">
                    Appears on the Weekly Master list and schedules daily execution sessions on Monday through Saturday so you stay consistent every day.
                  </p>
                </div>
              </label>

              {/* Option B: Weekly List Only */}
              <label
                onClick={() => setSchedulePattern('weekly-only')}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  schedulePattern === 'weekly-only'
                    ? 'bg-white border-[#1C1917] shadow-xs'
                    : 'bg-white/70 border-[#E5E0D8] hover:border-stone-400'
                }`}
              >
                <input
                  type="radio"
                  name="schedule-pattern"
                  checked={schedulePattern === 'weekly-only'}
                  onChange={() => setSchedulePattern('weekly-only')}
                  className="mt-0.5 accent-[#1C1917] cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#1C1917] block">
                    📋 Weekly Milestones List Only
                  </span>
                  <p className="text-[11px] text-[#78716C] leading-relaxed">
                    Places the task exclusively on the high-level Weekly Milestones master list without daily subtasks.
                  </p>
                </div>
              </label>

              {/* Option C: Custom Days Selection */}
              <div
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  schedulePattern === 'custom'
                    ? 'bg-white border-[#1C1917] shadow-xs'
                    : 'bg-white/70 border-[#E5E0D8] hover:border-stone-400'
                }`}
              >
                <label
                  onClick={() => setSchedulePattern('custom')}
                  className="flex items-center gap-2.5 text-xs font-bold text-[#1C1917] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="schedule-pattern"
                    checked={schedulePattern === 'custom'}
                    onChange={() => setSchedulePattern('custom')}
                    className="accent-[#1C1917] cursor-pointer"
                  />
                  <span>Select Specific Days Manually:</span>
                </label>

                {schedulePattern === 'custom' && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 pl-6">
                    {dayButtons.map((d) => {
                      const isSel = customDays.includes(d.num)
                      return (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleCustomDay(d.num)}
                          title={d.name}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isSel
                              ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#78716C] border-[#E5E0D8] hover:bg-stone-100'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Option Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 text-xs text-[#1C1917] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={navigateToTarget}
                onChange={(e) => setNavigateToTarget(e.target.checked)}
                className="w-4 h-4 rounded-md accent-[#1C1917] cursor-pointer"
              />
              <span className="font-medium">
                Immediately jump to target week ({targetWeekRange}) to view or edit the new tasks
              </span>
            </label>
          </div>

          {/* History Preservation Info Box */}
          <div className="p-3 bg-[#EBF2EC] border border-[#CFE1D3] rounded-2xl flex items-start gap-2.5 text-xs text-[#224A32]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#224A32] mt-0.5" />
            <div className="leading-relaxed">
              <strong>Original records are preserved:</strong> Your milestones in <strong className="font-semibold">{currentWeekRange}</strong> will not be removed or deleted. Fresh uncompleted copies will be scheduled in <strong className="font-semibold">{targetWeekRange}</strong> across your selected days.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-white border-t border-[#E5E0D8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#E5E0D8] text-xs font-semibold text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Repeat className="w-3.5 h-3.5 text-stone-200" />
            <span>{isSubmitting ? 'Copying…' : isMultiple ? `Copy ${taskList.length} Milestones` : 'Copy to Next Week'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
