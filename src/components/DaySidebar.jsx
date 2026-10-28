import { useEffect, useMemo } from 'react'
import { Calendar, Clock, Sun, ListTodo, ChevronRight, X } from 'lucide-react'
import {
  addDays,
  formatShortDate,
  formatDuration,
  getTodayDayNumber,
  getMonday,
  isSameWeek,
  formatWeekRange
} from '../utils/dateUtils'

export default function DaySidebar({
  weekStart,
  selectedDay,
  onSelectDay,
  getDayStats,
  isOpen,
  onClose
}) {
  const todayDayNumber = getTodayDayNumber()
  const isCurrentWeek = useMemo(() => isSameWeek(weekStart, getMonday(new Date())), [weekStart])

  // Keyboard accessibility: dismiss drawer on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const navItems = [
    {
      day: 0,
      name: 'Weekly Milestones',
      subtitle: 'All-Week Master List',
      icon: ListTodo,
      isWeekly: true
    },
    { day: 1, name: 'Monday', date: addDays(weekStart, 0) },
    { day: 2, name: 'Tuesday', date: addDays(weekStart, 1) },
    { day: 3, name: 'Wednesday', date: addDays(weekStart, 2) },
    { day: 4, name: 'Thursday', date: addDays(weekStart, 3) },
    { day: 5, name: 'Friday', date: addDays(weekStart, 4) },
    { day: 6, name: 'Saturday', date: addDays(weekStart, 5) },
    { day: 7, name: 'Sunday', date: addDays(weekStart, 6), isSunday: true }
  ]

  return (
    <>
      {/* Semi-transparent backdrop overlay with blur */}
      <div
        className={`fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#F8F6F0] border-r-2 border-[#1C1917] shadow-[8px_0px_0px_#1C1917]/20 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Weekly Milestones and Days Navigation"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#1C1917] bg-[#F8F6F0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-[#1C1917] border-2 border-[#1C1917] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_#1C1917]">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold tracking-tight text-[#1C1917] text-xs font-sans block leading-tight">
                DAYS & MILESTONES
              </span>
              <span className="text-[10px] text-[#78716C] font-mono block truncate mt-0.5">
                {formatWeekRange(weekStart)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-xl border border-[#1C1917] bg-white hover:bg-[#FECDD3] text-[#1C1917] shadow-[1px_1px_0px_#1C1917] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 p-3.5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isSelected = selectedDay === item.day
            const isToday = isCurrentWeek && item.day === todayDayNumber
            const stats = getDayStats(item.day)

            const Icon = item.icon || (item.isSunday ? Sun : Calendar)

            return (
              <button
                key={item.day}
                type="button"
                onClick={() => {
                  onSelectDay(item.day)
                  if (onClose) onClose()
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group text-left ${
                  isSelected
                    ? 'bg-[#FEF08A] text-[#1C1917] border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917] font-bold'
                    : 'bg-white hover:bg-stone-50 text-[#1C1917] border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Circular Icon Pill */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-white border border-[#1C1917] text-[#1C1917] shadow-[1px_1px_0px_#1C1917]'
                        : item.isSunday
                        ? 'bg-[#FECDD3] border border-[#1C1917] text-[#9F1239]'
                        : item.isWeekly
                        ? 'bg-[#FEF08A] border border-[#1C1917] text-[#1C1917]'
                        : 'bg-[#F8F6F0] border border-[#1C1917] text-[#1C1917]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate tracking-tight">
                        {item.name}
                      </span>
                      {isToday && (
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-white text-[#1C1917] border border-[#1C1917]'
                              : 'bg-[#BBF7D0] text-[#166534] border border-[#1C1917]'
                          }`}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs flex items-center gap-2 mt-0.5 ${
                        isSelected ? 'text-stone-300' : 'text-[#78716C]'
                      }`}
                    >
                      {item.date ? (
                        <span>{formatShortDate(item.date)}</span>
                      ) : (
                        <span>{item.subtitle}</span>
                      )}
                      {stats.totalMinutes > 0 && (
                        <span className="flex items-center gap-0.5 font-mono text-[11px]">
                          <Clock className="w-3 h-3 opacity-70" />
                          {formatDuration(stats.totalMinutes)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right task counters */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  {stats.taskCount > 0 ? (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-white/15 border-white/25 text-white'
                          : stats.completedCount === stats.taskCount
                          ? 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32]'
                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#57534E]'
                      }`}
                    >
                      {stats.completedCount}/{stats.taskCount}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-mono ${
                        isSelected ? 'text-stone-400' : 'text-stone-400'
                      }`}
                    >
                      0
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? 'text-white translate-x-0.5' : 'text-stone-400 group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E5E0D8] bg-white/70 backdrop-blur-md shrink-0 flex items-center justify-between text-xs text-[#78716C]">
          <span className="font-medium text-[11px]">Press Esc or click outside to close</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#1C1917] hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  )
}
