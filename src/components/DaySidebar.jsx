import { Calendar, Clock, Sun, ListTodo, ChevronRight } from 'lucide-react'
import {
  addDays,
  formatShortDate,
  formatDuration,
  getTodayDayNumber,
  getMonday,
  isSameWeek
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
  const isCurrentWeek = isSameWeek(weekStart, getMonday(new Date()))

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
    <aside
      className={`w-full md:w-64 lg:w-72 shrink-0 flex-col transition-all duration-200 ${
        isOpen ? 'flex' : 'hidden md:flex'
      }`}
    >
      {/* Mobile header only on small screens when expanded */}
      {isOpen && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E0D8] md:hidden">
          <span className="font-semibold text-[#1C1917] text-xs uppercase tracking-wider">
            Select Day
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Architectural Navigation Dock - sticky in desktop flow so it stays accessible */}
      <nav className="space-y-1.5 md:sticky md:top-20 bg-white/80 backdrop-blur-md border border-[#E5E0D8] rounded-3xl p-2.5 shadow-[0_10px_30px_-5px_rgba(28,25,23,0.04)]">
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
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-[#1C1917] text-white shadow-md shadow-stone-900/15'
                    : 'hover:bg-white text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Circular Icon Pill */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-white/10 border-white/20 text-[#FAF8F5]'
                        : item.isSunday
                        ? 'bg-[#F4ECE1] border-[#E8DAC5] text-[#695431]'
                        : 'bg-white border-[#E5E0D8] text-[#78716C] group-hover:text-[#1C1917]'
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
                              ? 'bg-white/20 text-white border-white/30'
                              : 'bg-[#EBF2EC] text-[#224A32] border-[#CFE1D3]'
                          }`}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs flex items-center gap-2 ${
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
                <div className="flex items-center gap-1.5 shrink-0">
                  {stats.taskCount > 0 ? (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-white/15 border-white/25 text-white'
                          : stats.completedCount === stats.taskCount
                          ? 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32]'
                          : 'bg-white border-[#E5E0D8] text-[#57534E]'
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
                      isSelected ? 'text-white translate-x-0.5' : 'text-stone-400'
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </nav>
      </aside>
  )
}
