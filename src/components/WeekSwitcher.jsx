import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { addDays, formatShortDate, formatWeekRange, getMonday, isSameWeek } from '../utils/dateUtils'

export default function WeekSwitcher({ weekStart, onPrevWeek, onNextWeek, onCurrentWeek }) {
  const currentWeekMonday = useMemo(() => getMonday(new Date()), [])
  const isViewingCurrentWeek = isSameWeek(weekStart, currentWeekMonday)
  const rangeLabel = formatWeekRange(weekStart)
  const mobileRangeLabel = `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* Previous Week Button */}
      <button
        type="button"
        onClick={onPrevWeek}
        aria-label="Previous week"
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white hover:bg-[#FEF08A] border border-[#1C1917]/30 sm:border-2 sm:border-[#1C1917] text-[#1C1917] shadow-none sm:shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs transition-all cursor-pointer shrink-0"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Date Range Badge */}
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white border border-[#1C1917]/30 sm:border-2 sm:border-[#1C1917] text-[#1C1917] text-[11px] sm:text-xs font-bold tracking-tight shadow-none sm:shadow-[2px_2px_0px_#1C1917] shrink-0">
        <Calendar className="hidden sm:block w-3.5 h-3.5 text-[#1C1917] shrink-0" />
        <span className="sm:hidden whitespace-nowrap font-sans">{mobileRangeLabel}</span>
        <span className="hidden sm:inline whitespace-nowrap font-sans">{rangeLabel}</span>
        {isViewingCurrentWeek && (
          <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FEF08A] text-[#1C1917] border border-[#1C1917]">
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
          className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917] border border-[#1C1917]/40 sm:border-2 sm:border-[#1C1917] shadow-none sm:shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <span className="sm:hidden">Now</span>
          <span className="hidden sm:inline">Current Week</span>
        </button>
      )}

      {/* Next Week Button */}
      <button
        type="button"
        onClick={onNextWeek}
        aria-label="Next week"
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white hover:bg-[#FEF08A] border border-[#1C1917]/30 sm:border-2 sm:border-[#1C1917] text-[#1C1917] shadow-none sm:shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs transition-all cursor-pointer shrink-0"
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  )
}
