import { LogOut, Menu, Clock, Home, BarChart3, Download, HelpCircle } from 'lucide-react'
import WeekSwitcher from './WeekSwitcher'
import { formatDuration } from '../utils/dateUtils'

export default function TopBar({
  user,
  stats,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onSignOut,
  onToggleSidebar,
  sidebarOpen = false,
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

  // Architectural pill completion badge style
  let badgeClasses = 'bg-white/80 border-[#E5E0D8] text-[#44403C]'
  let barColor = 'bg-[#1C1917]'

  if (total > 0) {
    if (percent === 100) {
      badgeClasses = 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32]'
      barColor = 'bg-[#224A32]'
    } else if (percent >= 50) {
      badgeClasses = 'bg-[#FAF4EB] border-[#E8DAC5] text-[#695431]'
      barColor = 'bg-[#44403C]'
    }
  }

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-[#F2EFE9]/95 border-b border-[#E5E0D8]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 lg:gap-4 flex-nowrap overflow-x-auto no-scrollbar">
        {/* Left: Navigation sidebar toggle (all screens) + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle Milestones & Days navigation"
            aria-expanded={sidebarOpen}
            title="Toggle Weekly Milestones & Days menu"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
              sidebarOpen
                ? 'bg-[#1C1917] text-white border-[#1C1917]'
                : 'bg-white hover:bg-[#FAF8F5] border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] hover:border-[#1C1917]'
            }`}
          >
            <Menu className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-xs font-semibold">
              Days
            </span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            title="Go to Homepage (Today)"
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            {/* Website Icon */}
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E0D8] p-1 flex items-center justify-center shadow-sm group-hover:border-[#1C1917] transition-all overflow-hidden shrink-0">
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <WeekSwitcher
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            onCurrentWeek={onCurrentWeek}
          />

          {/* Unified Compact Completion & Time Budget Pill */}
          <div
            className={`font-mono text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${badgeClasses}`}
          >
            <span>[ {percent}% · {completed}/{total} ]</span>
            {totalBudgetedMinutes > 0 && (
              <>
                <span className="text-stone-300">|</span>
                <Clock className="w-3.5 h-3.5 text-[#224A32] shrink-0" />
                <span>{formatDuration(totalBudgetedMinutes)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions (Today, Reports, Tour, Profile, Logout) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            title="Go to Today (Homepage)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1C1917] hover:bg-black text-[#FAF8F5] text-xs font-medium shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Today</span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            title="Download Reports (Weekly, Monthly, Yearly)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-medium transition-all shadow-sm cursor-pointer group whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#57534E] group-hover:text-[#1C1917]" />
            <span className="hidden xl:inline">Reports</span>
          </button>

          <button
            type="button"
            onClick={onOpenTutorial}
            title="App Tutorial & Feature Guide"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-medium transition-all shadow-sm cursor-pointer group whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#57534E] group-hover:text-[#1C1917]" />
            <span className="hidden xl:inline">Tour</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            title="Profile & Milestone Analytics"
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 sm:pr-2.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-medium transition-all shadow-sm cursor-pointer group whitespace-nowrap"
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

          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Log out</span>
          </button>
        </div>
      </div>

      {/* Thin Architectural Progress Indicator */}
      <div className="w-full bg-[#E5E0D8]/60 h-0.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </header>
  )
}
