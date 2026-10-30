import { Clock, Home, Download, HelpCircle, BarChart3 } from 'lucide-react'
import WeekSwitcher from './WeekSwitcher'
import { formatDuration } from '../utils/dateUtils'

export default function TopBar({
  user,
  stats,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onGoHome,
  onOpenProfile,
  onOpenReport,
  onOpenTutorial
}) {
  const { total, completed, percent, totalBudgetedMinutes } = stats

  const rawAvatar =
    user?.user_metadata?.avatar_url ||
    (user?.id ? localStorage.getItem('user_avatar_' + user.id) : null)
  const isSafeAvatar =
    typeof rawAvatar === 'string' &&
    (/^https:\/\//i.test(rawAvatar) ||
      /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(rawAvatar))
  const avatarUrl = isSafeAvatar ? rawAvatar : null
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'

  return (
    <header className="sticky top-0 z-20 bg-[#F8F6F0] border-b-2 border-[#1C1917] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 lg:gap-4 flex-nowrap overflow-x-auto no-scrollbar">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            title="Go to Homepage (Today)"
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            {/* Website Icon */}
            <div className="w-8 h-8 rounded-xl bg-white border-2 border-[#1C1917] p-1 flex items-center justify-center shadow-[2px_2px_0px_#1C1917] group-hover:bg-[#FEF08A] transition-all overflow-hidden shrink-0">
              <img
                src="/favicon.png"
                alt="Milestones Website Icon"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold tracking-tight text-[#1C1917] text-xs font-sans block leading-none">
                MILESTONES
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#78716C] block font-medium mt-0.5">
                WEEKLY PLANNER
              </span>
            </div>
          </button>
        </div>

        {/* Center: Week Switcher & Unified Stats Badge */}
        <div
          data-tour="week-switcher"
          className="flex items-center gap-1.5 sm:gap-2.5 shrink-0"
        >
          <WeekSwitcher
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            onCurrentWeek={onCurrentWeek}
          />

          {/* Unified Compact Completion & Time Budget Pill */}
          <div
            title={`Week Progress: ${completed} of ${total} tasks completed (${percent}%)`}
            className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] bg-[#BBF7D0] text-[#1C1917] whitespace-nowrap flex items-center gap-2"
          >
            <span className="flex items-center gap-1">
              <span>{percent}%</span>
              <span className="text-[#1C1917]/60 font-medium">({completed}/{total})</span>
            </span>

            {/* Authentic Neo-Brutalist Capsule Progress Bar */}
            {total > 0 && (
              <div className="w-12 sm:w-16 h-2.5 rounded-full border border-[#1C1917] bg-white overflow-hidden p-[1px] shadow-[0.5px_0.5px_0px_#1C1917]">
                <div
                  className="h-full rounded-full bg-[#16A34A] transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}

            {totalBudgetedMinutes > 0 && (
              <>
                <span className="text-[#1C1917]/30 font-normal">|</span>
                <Clock className="w-3.5 h-3.5 text-[#1C1917] stroke-[2] shrink-0" />
                <span>{formatDuration(totalBudgetedMinutes)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions (Today, Reports, Tour, Profile) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            title="Go to Today (Homepage)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1917] hover:bg-black text-[#FAF8F5] text-xs font-bold border-2 border-[#1C1917] shadow-[2px_2px_0px_#78716C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Today</span>
          </button>

          <button
            type="button"
            data-tour="reports-btn"
            onClick={onOpenReport}
            title="Download Reports (Weekly, Monthly, Yearly)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FEF08A] border-2 border-[#1C1917] text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#57534E] group-hover:text-[#1C1917]" />
            <span className="hidden xl:inline">Reports</span>
          </button>

          <button
            type="button"
            onClick={onOpenTutorial}
            title="App Tutorial & Feature Guide"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FEF08A] border-2 border-[#1C1917] text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#57534E] group-hover:text-[#1C1917]" />
            <span className="hidden xl:inline">Tour</span>
          </button>

          <button
            type="button"
            data-tour="analytics-btn"
            onClick={onOpenProfile}
            title="Profile & Milestone Analytics"
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 sm:pr-2.5 rounded-xl bg-white hover:bg-[#FEF08A] border-2 border-[#1C1917] text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group whitespace-nowrap"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-[#E5E0D8]"
              />
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center text-[10px] font-bold font-serif shadow-sm">
                {userInitial}
              </div>
            )}
            <span className="hidden xl:inline text-xs font-semibold text-[#44403C] group-hover:text-[#1C1917]">
              Profile
            </span>
            <BarChart3 className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1C1917] transition-colors" />
          </button>
        </div>
      </div>
    </header>
  )
}
