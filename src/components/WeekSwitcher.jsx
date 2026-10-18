import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatWeekRange, getMonday, isSameWeek } from '../utils/dateUtils'

export default function WeekSwitcher({ weekStart, onPrevWeek, onNextWeek, onCurrentWeek }) {
  const currentWeekMonday = getMonday(new Date())
  const isViewingCurrentWeek = isSameWeek(weekStart, currentWeekMonday)
  const rangeLabel = formatWeekRange(weekStart)

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Previous Week Button */}
      <button
        type="button"
        onClick={onPrevWeek}
        aria-label="Previous week"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs transition-colors shadow-sm cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Date Range Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[#292524] text-xs font-medium tracking-tight shadow-sm">
        <Calendar className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
        <span className="whitespace-nowrap font-sans">{rangeLabel}</span>
      </div>

      {/* Current Week Button */}
      <button
        type="button"
        onClick={onCurrentWeek}
        disabled={isViewingCurrentWeek}
        aria-label="Jump to current week"
        className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          isViewingCurrentWeek
            ? 'bg-[#1C1917] border-[#1C1917] text-white font-semibold shadow-sm cursor-default'
            : 'bg-white hover:bg-[#FAF8F5] border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] shadow-sm'
        }`}
      >
        <span>Current</span>
        <span className="hidden sm:inline"> Week</span>
      </button>

      {/* Next Week Button */}
      <button
        type="button"
        onClick={onNextWeek}
        aria-label="Next week"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs transition-colors shadow-sm cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
