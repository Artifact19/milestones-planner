import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatWeekRange, getMonday, isSameWeek } from '../utils/dateUtils'

export default function WeekSwitcher({ weekStart, onPrevWeek, onNextWeek, onCurrentWeek }) {
  const currentWeekMonday = getMonday(new Date())
  const isViewingCurrentWeek = isSameWeek(weekStart, currentWeekMonday)
  const rangeLabel = formatWeekRange(weekStart)

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* Previous Week Button */}
      <button
        type="button"
        onClick={onPrevWeek}
        aria-label="Previous week"
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs transition-colors shadow-sm cursor-pointer shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Date Range Badge */}
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[#292524] text-xs font-medium tracking-tight shadow-sm shrink-0">
        <Calendar className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
        <span className="whitespace-nowrap font-sans">{rangeLabel}</span>
        {isViewingCurrentWeek && (
          <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#1C1917] text-white">
            Current
          </span>
        )}
      </div>

      {/* Jump to Current Week Button (Shown only when viewing a different week) */}
      {!isViewingCurrentWeek && (
        <button
          type="button"
          onClick={onCurrentWeek}
          aria-label="Jump to current week"
          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1C1917] hover:bg-black text-white shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Current Week</span>
        </button>
      )}

      {/* Next Week Button */}
      <button
        type="button"
        onClick={onNextWeek}
        aria-label="Next week"
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs transition-colors shadow-sm cursor-pointer shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
