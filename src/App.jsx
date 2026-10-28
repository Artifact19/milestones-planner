import { useState, useMemo, useCallback, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import AuthPage from './components/AuthPage'
import TopBar from './components/TopBar'
import DaySidebar from './components/DaySidebar'
import FocusedDayView from './components/FocusedDayView'
import ProfileModal from './components/ProfileModal'
import ReportModal from './components/ReportModal'
import TutorialModal from './components/TutorialModal'
import { useMilestones } from './hooks/useMilestones'
import { getMonday, addWeeks, getTodayDayNumber, formatWeekRange } from './utils/dateUtils'
import { X, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

function TrackerMain() {
  const { user, signOut, isPasswordRecovery } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => getTodayDayNumber())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Auto-launch tutorial on first sign-in if not yet completed or skipped
  useEffect(() => {
    if (user?.id) {
      const hasCompleted = localStorage.getItem('milestones_tutorial_completed_' + user.id)
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setTutorialOpen(true)
        }, 400)
        return () => clearTimeout(timer)
      }
    }
  }, [user?.id])

  const handleCompleteTutorial = useCallback(() => {
    if (user?.id) {
      localStorage.setItem('milestones_tutorial_completed_' + user.id, 'true')
    }
    setTutorialOpen(false)
  }, [user?.id])

  const handleOpenTutorial = useCallback(() => {
    setTutorialOpen(true)
  }, [])

  const {
    milestones,
    loading,
    error,
    clearError,
    addMilestone,
    addBatchMilestones,
    toggleMilestone,
    updateMilestone,
    moveMilestone,
    moveMilestoneToWeek,
    batchMoveMilestonesToWeek,
    copyMilestonesToWeek,
    deleteMilestone,
    deleteSeries,
    completeSeriesInWeek,
    stats,
    getDayStats
  } = useMilestones(weekStart)

  const handlePrevWeek = () => setWeekStart((prev) => addWeeks(prev, -1))
  const handleNextWeek = () => setWeekStart((prev) => addWeeks(prev, 1))
  const handleCurrentWeek = () => {
    setWeekStart(getMonday(new Date()))
    setSelectedDay(getTodayDayNumber())
  }

  // Cross-week carry forward / copy handler for weekly milestones (preserves current week history)
  const handleCopyMilestonesToWeek = useCallback(
    async (tasks, targetWeekMonday, selectedDays = [0, 1, 2, 3, 4, 5, 6], shouldNavigate = false) => {
      const taskList = Array.isArray(tasks) ? tasks : [tasks]
      const success = await copyMilestonesToWeek(taskList, targetWeekMonday, selectedDays)

      if (success) {
        const rangeText = formatWeekRange(targetWeekMonday)
        const countText =
          taskList.length === 1 ? `"${taskList[0].title}"` : `${taskList.length} milestones`

        const daysNote = selectedDays.length > 1 ? ' (scheduled Mon–Sat)' : ''

        if (shouldNavigate) {
          setWeekStart(targetWeekMonday)
          setSelectedDay(0) // Land on Weekly Master in the destination week
          setToast({
            text: `${countText} carried forward to ${rangeText}${daysNote}!`,
            targetWeek: null
          })
        } else {
          setToast({
            text: `${countText} carried forward to ${rangeText}${daysNote}. Previous week preserved!`,
            targetWeek: targetWeekMonday,
            targetDay: 0
          })
        }
      }
    },
    [copyMilestonesToWeek]
  )

  // Homepage navigation (returns to today's date in current week)
  const handleGoHome = useCallback(() => {
    setWeekStart(getMonday(new Date()))
    setSelectedDay(getTodayDayNumber())
  }, [])

  // Step to previous day (without side-effect inside updater function)
  const handlePrevDay = useCallback(() => {
    if (selectedDay === 0) {
      setSelectedDay(7)
    } else if (selectedDay === 1) {
      // From Monday, move to Sunday of previous week
      setWeekStart((prev) => addWeeks(prev, -1))
      setSelectedDay(7)
    } else {
      setSelectedDay(selectedDay - 1)
    }
  }, [selectedDay])

  // Step to next day (clean single week shift when moving Sunday -> Monday)
  const handleNextDay = useCallback(() => {
    if (selectedDay === 0) {
      setSelectedDay(1)
    } else if (selectedDay === 7) {
      // From Sunday, move to Monday of next week
      setWeekStart((prev) => addWeeks(prev, 1))
      setSelectedDay(1)
    } else {
      setSelectedDay(selectedDay + 1)
    }
  }, [selectedDay])

  // Filter tasks for the selected day view
  const currentTasks = useMemo(() => {
    return milestones.filter((m) => m.day_of_week === selectedDay)
  }, [milestones, selectedDay])

  // Weekly master milestones (day_of_week === 0)
  const weeklyTasks = useMemo(() => {
    return milestones.filter((m) => m.day_of_week === 0)
  }, [milestones])

  const currentDayStats = useMemo(() => {
    return getDayStats(selectedDay)
  }, [getDayStats, selectedDay])

  if (!user || isPasswordRecovery) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-[#F2EFE9] text-[#1C1917] flex flex-col font-sans selection:bg-[#1C1917] selection:text-[#FAF8F5]">
      {/* Sticky Top Bar */}
      <TopBar
        user={user}
        stats={stats}
        weekStart={weekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
        onSignOut={signOut}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        onGoHome={handleGoHome}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onOpenTutorial={handleOpenTutorial}
      />

      {/* Navigation Drawer (Weekly Milestones & Mon–Sun Days) */}
      <DaySidebar
        weekStart={weekStart}
        selectedDay={selectedDay}
        onSelectDay={(day) => setSelectedDay(day)}
        getDayStats={getDayStats}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container: Focused Workspace with Spacious Breathing Room */}
      <div className="flex-1 max-w-4xl lg:max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col items-center">
        <main className="w-full flex-1 flex flex-col gap-5 min-w-0">
          {/* Error Notification Banner */}
          {error && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                aria-label="Dismiss error"
                className="p-1 rounded-full hover:bg-rose-100 text-rose-700 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-stone-400 gap-3">
              <Loader2 className="w-8 h-8 text-[#1C1917] animate-spin" />
              <p className="text-xs uppercase tracking-widest font-semibold text-[#78716C]">
                Loading Milestones…
              </p>
            </div>
          ) : (
            <FocusedDayView
              weekStart={weekStart}
              selectedDay={selectedDay}
              tasks={currentTasks}
              weeklyTasks={weeklyTasks}
              allMilestones={milestones}
              dayStats={currentDayStats}
              onToggle={toggleMilestone}
              onEdit={updateMilestone}
              onDelete={deleteMilestone}
              onDeleteSeries={deleteSeries}
              onCompleteSeries={completeSeriesInWeek}
              onMove={moveMilestone}
              onCopyMilestones={handleCopyMilestonesToWeek}
              onAdd={addMilestone}
              onAddBatch={addBatchMilestones}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
              onGoHome={handleGoHome}
            />
          )}
        </main>
      </div>

      {/* Profile & Analytics Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onOpenTutorial={handleOpenTutorial}
      />

      {/* Milestone Reports Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        weekStart={weekStart}
        currentWeekMilestones={milestones}
      />

      {/* Onboarding & Feature Guide Tutorial */}
      <TutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onComplete={handleCompleteTutorial}
      />

      {/* Feedback Toast Notification (with 1-click Jump to Week) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#1C1917] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 border border-stone-800">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#CFE1D3] shrink-0" />
            <span className="font-medium truncate">{toast.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {toast.targetWeek && (
              <button
                type="button"
                onClick={() => {
                  setWeekStart(toast.targetWeek)
                  setSelectedDay(toast.targetDay ?? 0)
                  setToast(null)
                }}
                className="flex items-center gap-1 font-bold text-stone-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                <span>Jump to Week</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TrackerMain />
      <Analytics />
    </AuthProvider>
  )
}
