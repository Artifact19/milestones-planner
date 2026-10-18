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
  onGoHome,
  onOpenProfile,
  onOpenReport,
  onOpenTutorial
}) {
  const { total, completed, percent, totalBudgetedMinutes } = stats

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    (user?.id ? localStorage.getItem('user_avatar_' + user.id) : null)
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
    <header className="sticky top-0 z-20 backdrop-blur-md bg-[#F2EFE9]/90 border-b border-[#E5E0D8]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
        {/* Left: Mobile menu toggle + Monogram Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-full bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] shadow-sm cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onGoHome}
            title="Go to Homepage (Today)"
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            {/* Website Icon */}
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E0D8] p-1 flex items-center justify-center shadow-sm group-hover:border-[#1C1917] transition-all overflow-hidden shrink-0">
              <img
                src="/favicon.png"
                alt="Milestones Website Icon"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-[#1C1917] text-sm block">
                MILESTONES
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#78716C] block -mt-0.5 font-medium">
                WEEKLY PLANNER
              </span>
            </div>
          </button>
        </div>

        {/* Center: Week Switcher & Completion Pill */}
        <div className="flex flex-wrap items-center gap-2.5 order-3 md:order-2">
          <WeekSwitcher
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            onCurrentWeek={onCurrentWeek}
          />

          {/* Minimalist Completion Badge */}
          <div
            className={`font-mono text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-all ${badgeClasses}`}
          >
            [ {percent}% | {completed}/{total} Done ]
          </div>

          {/* Total Weekly Time Budgeted */}
          {totalBudgetedMinutes > 0 && (
            <div className="hidden xl:flex items-center gap-1 font-mono text-xs px-3 py-1.5 rounded-full bg-white/80 border border-[#E5E0D8] text-[#57534E] shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[#224A32]" />
              <span>{formatDuration(totalBudgetedMinutes)} week</span>
            </div>
          )}
        </div>

        {/* Right: Homepage / Today pill + User + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 order-2 md:order-3">
          <button
            type="button"
            onClick={onGoHome}
            title="Go to Today (Homepage)"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C1917] hover:bg-black text-[#FAF8F5] text-xs font-medium shadow-md shadow-stone-900/10 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Today</span>
          </button>

          {/* Quick Reports Download Trigger */}
          <button
            type="button"
            onClick={onOpenReport}
            title="Download Reports (Weekly, Monthly, Yearly)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-medium transition-all shadow-sm cursor-pointer group"
          >
            <Download className="w-3.5 h-3.5 text-[#57534E] group-hover:text-[#1C1917]" />
            <span className="hidden sm:inline">Reports</span>
          </button>

          {/* Feature Guide & Tour Trigger */}
          <button
            type="button"
            onClick={onOpenTutorial}
            title="App Tutorial & Feature Guide"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-medium transition-all shadow-sm cursor-pointer group"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#57534E] group-hover:text-[#1C1917]" />
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Profile & Analytics Trigger Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="Profile & Milestone Analytics"
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-medium transition-all shadow-sm cursor-pointer group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover border border-[#E5E0D8]"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center text-[10px] font-bold font-serif shadow-sm">
                {userInitial}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-[#44403C] group-hover:text-[#1C1917]">
              Profile
            </span>
            <BarChart3 className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1C1917] transition-colors" />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
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
