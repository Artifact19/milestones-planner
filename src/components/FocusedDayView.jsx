
import { useState, useMemo } from 'react'
import {
  Clock,
  Coffee,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Briefcase,
  BookOpen,
  Sun,
  ListTodo,
  Info,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  PieChart,
  ChevronDown
} from 'lucide-react'
import TaskItem from './TaskItem'
import AddTaskInput from './AddTaskInput'
import SundayCard from './SundayCard'
import MasterCompletionModal from './MasterCompletionModal'
import MoveToWeekModal from './MoveToWeekModal'
import {
  DAY_NAMES,
  addDays,
  formatShortDate,
  formatDuration,
  getTodayDayNumber,
  getMonday,
  isSameWeek,
  normalizeCategory
} from '../utils/dateUtils'


function reorderTaskList(list, sourceId, targetId, position) {
  if (!sourceId || !targetId || sourceId === targetId) return list;

  const sourceIndex = list.findIndex((t) => t.id === sourceId);
  const targetIndex = list.findIndex((t) => t.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return list;

  const itemToMove = list[sourceIndex];
  const listWithoutItem = list.filter((_, idx) => idx !== sourceIndex);

  const newTargetIndex = listWithoutItem.findIndex((t) => t.id === targetId);
  if (newTargetIndex === -1) return list;

  const insertIndex = position === 'below' ? newTargetIndex + 1 : newTargetIndex;

  const nextList = [...listWithoutItem];
  nextList.splice(insertIndex, 0, itemToMove);
  return nextList;
}


export default function FocusedDayView({
  weekStart,
  selectedDay,
  onSelectDay,
  tasks = [],
  weeklyTasks = [],
  allMilestones = [],
  dayStats,
  onToggle,
  onEdit,
  onRepeatAcrossDays,
  onDelete,
  onDeleteSeries,
  onCompleteSeries,
  onMove,
  onReorderTasks,
  onMoveToWeek,
  onCopyMilestones,
  onAdd,
  onAddBatch,
  onPrevDay,
  onNextDay,
  onGoHome
}) {
  
  // Drag and drop reordering state
  const [draggedItem, setDraggedItem] = useState(null); // { id: string, listType: 'day' | 'weekly' } | null
  const [dropTarget, setDropTarget] = useState(null); // { id: string, position: 'above' | 'below', listType: 'day' | 'weekly' } | null

  const handleDragStart = (id, listType) => {
    setDraggedItem({ id, listType });
  };

  const handleDragOver = (id, position, listType) => {
    if (!draggedItem || draggedItem.listType !== listType || draggedItem.id === id) {
      return;
    }
    setDropTarget({ id, position, listType });
  };

  const handleDragLeave = (id, listType) => {
    if (dropTarget?.id === id && dropTarget?.listType === listType) {
      setDropTarget(null);
    }
  };

  const handleDrop = (targetId, position, listType) => {
    const finalTargetId = targetId || dropTarget?.id;
    const finalPosition = position || dropTarget?.position || 'above';
    const finalType = listType || dropTarget?.listType || 'day';

    if (draggedItem && finalTargetId && draggedItem.id !== finalTargetId && draggedItem.listType === finalType) {
      const isWeeklyList = finalType === 'weekly';
      const targetList = isWeeklyList ? weeklyTasks : tasks;
      const targetDay = isWeeklyList ? 0 : selectedDay;

      const updatedList = reorderTaskList(targetList, draggedItem.id, finalTargetId, finalPosition);
      if (onReorderTasks) {
        onReorderTasks(targetDay, updatedList);
      }
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleMoveRelative = (taskId, direction, listType = 'day') => {
    const isWeeklyList = listType === 'weekly';
    const targetList = isWeeklyList ? weeklyTasks : tasks;
    const targetDay = isWeeklyList ? 0 : selectedDay;

    const currentIndex = targetList.findIndex((t) => t.id === taskId);
    if (currentIndex === -1) return;
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= targetList.length) return;

    const nextList = [...targetList];
    const [moved] = nextList.splice(currentIndex, 1);
    nextList.splice(newIndex, 0, moved);

    if (onReorderTasks) {
      onReorderTasks(targetDay, nextList);
    }
  };

  const isWeeklyMaster = selectedDay === 0
  const isSunday = selectedDay === 7
  const todayDayNumber = getTodayDayNumber()
  const isCurrentWeek = useMemo(
    () => isSameWeek(weekStart, getMonday(new Date())),
    [weekStart]
  )
  const isToday = isCurrentWeek && selectedDay === todayDayNumber

  const dayDate = useMemo(() => {
    if (selectedDay === 0) return null
    return addDays(weekStart, selectedDay - 1)
  }, [weekStart, selectedDay])

  const title = isWeeklyMaster ? 'Weekly Milestones' : DAY_NAMES[selectedDay]

  // Sunday 3-4 hour study analysis
  const careerFocusMins = dayStats.careerFocusMinutes || 0
  const isInSundayStudyZone = careerFocusMins >= 180 && careerFocusMins <= 240
  const isOverSundayStudy = careerFocusMins > 240

  const completedWeeklyCount = weeklyTasks.filter((t) => t.is_completed).length
  const incompleteWeeklyTasks = useMemo(
    () => weeklyTasks.filter((t) => !t.is_completed),
    [weeklyTasks]
  )

  // Sub-tasks handling for master milestones
  const [pendingMasterCompletion, setPendingMasterCompletion] = useState(null)
  // Cross-week placement modal state: null | { tasks: Task[] }
  const [moveToWeekData, setMoveToWeekData] = useState(null)
  // Interactive daily time breakdown filter: null (collapsed) | 'all' | 'career' | 'college' | 'personal'
  const [dayBreakdownCat, setDayBreakdownCat] = useState(null)

  const handleToggleDayBreakdown = (cat) => {
    setDayBreakdownCat((prev) => (prev === cat ? null : cat))
  }

  const dayTasksSortedByTime = useMemo(() => {
    const filtered =
      !dayBreakdownCat || dayBreakdownCat === 'all'
        ? tasks
        : tasks.filter((t) => normalizeCategory(t.tag) === dayBreakdownCat)
    return [...filtered].sort((a, b) => {
      const aTotal = (a.duration_minutes ?? 30) + (a.break_minutes ?? 5)
      const bTotal = (b.duration_minutes ?? 30) + (b.break_minutes ?? 5)
      return bTotal - aTotal
    })
  }, [tasks, dayBreakdownCat])

  const getSubTasksForTask = (task) => {
    if (!task || task.day_of_week !== 0) return []
    if (task.series_id) {
      return allMilestones
        .filter((m) => m.series_id === task.series_id && m.day_of_week > 0)
        .sort((a, b) => a.day_of_week - b.day_of_week)
    }
    const norm = task.title?.trim().toLowerCase()
    if (!norm) return []
    return allMilestones
      .filter((m) => m.day_of_week > 0 && m.title?.trim().toLowerCase() === norm)
      .sort((a, b) => a.day_of_week - b.day_of_week)
  }

  const getHasConnectedTasks = (task) => {
    if (!task) return false
    if (task.series_id) {
      return allMilestones.some((m) => m.id !== task.id && m.series_id === task.series_id)
    }
    const norm = task.title?.trim().toLowerCase()
    if (!norm) return false
    return allMilestones.some(
      (m) => m.id !== task.id && m.title?.trim().toLowerCase() === norm
    )
  }

  const handleMasterToggleRequest = (task, subTasks) => {
    if (task.is_completed) {
      onToggle(task.id)
      return
    }

    const hasIncomplete = subTasks && subTasks.some((st) => !st.is_completed)
    if (hasIncomplete) {
      setPendingMasterCompletion({ task, subTasks })
    } else {
      onToggle(task.id)
    }
  }

  const handlePreserveHistory = () => {
    if (pendingMasterCompletion?.task) {
      onToggle(pendingMasterCompletion.task.id)
    }
    setPendingMasterCompletion(null)
  }

  const handleCompleteAll = () => {
    if (pendingMasterCompletion?.task) {
      if (onCompleteSeries && pendingMasterCompletion.task.series_id) {
        onCompleteSeries(pendingMasterCompletion.task.series_id)
      } else {
        onToggle(pendingMasterCompletion.task.id)
      }
    }
    setPendingMasterCompletion(null)
  }

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0 pb-16">
      {/* Neo-Brutalist Segmented Days Strip & Stepper */}
      <div
        data-tour="day-strip"
        className="flex flex-wrap items-center justify-between gap-2 bg-white border-2 border-[#1C1917] rounded-2xl p-1.5 shadow-[2.5px_2.5px_0px_#1C1917]"
      >
        {/* Direct Day Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { num: 0, label: 'Wk', name: 'Weekly Master' },
            { num: 1, label: 'Mon', name: 'Monday' },
            { num: 2, label: 'Tue', name: 'Tuesday' },
            { num: 3, label: 'Wed', name: 'Wednesday' },
            { num: 4, label: 'Thu', name: 'Thursday' },
            { num: 5, label: 'Fri', name: 'Friday' },
            { num: 6, label: 'Sat', name: 'Saturday' },
            { num: 7, label: 'Sun', name: 'Sunday' }
          ].map((d) => {
            const isSelected = selectedDay === d.num
            const isTodayDay = isCurrentWeek && d.num === todayDayNumber
            return (
              <button
                key={d.num}
                type="button"
                onClick={() => onSelectDay?.(d.num)}
                title={d.name}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#FEF08A] text-[#1C1917] border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] font-black'
                    : 'bg-white hover:bg-stone-50 text-[#57534E] hover:text-[#1C1917] border border-[#1C1917]/30'
                }`}
              >
                {d.num === 0 && <ListTodo className="w-3 h-3 stroke-[2.5]" />}
                <span>{d.label}</span>
                {isTodayDay && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" title="Today" />
                )}
              </button>
            )
          })}
        </div>

        {/* Stepper Controls: Previous / Today / Next */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="Previous day"
            title="Previous day"
            className="p-1 rounded-lg bg-white hover:bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] shadow-[1px_1px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={onGoHome}
            title="Go to Today"
            className={`px-2.5 py-1 rounded-lg border border-[#1C1917] text-xs font-bold shadow-[1px_1px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
              isToday ? 'bg-[#FEF08A] text-[#1C1917] font-black' : 'bg-white hover:bg-[#FEF08A] text-[#1C1917]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNextDay}
            aria-label="Next day"
            title="Next day"
            className="p-1 rounded-lg bg-white hover:bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] shadow-[1px_1px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Architectural Workspace Card */}
      <div
        data-tour="time-budget"
        className="bg-white border-2 border-[#1C1917] rounded-3xl p-5 sm:p-7 shadow-[4px_4px_0px_#1C1917]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#1C1917]/15">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] ${
                  isSunday
                    ? 'bg-[#FECDD3] text-[#9F1239]'
                    : isWeeklyMaster
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#FEF08A] text-[#1C1917]'
                }`}
              >
                {isSunday ? (
                  <Sun className="w-5 h-5 stroke-[2.5]" />
                ) : isWeeklyMaster ? (
                  <ListTodo className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Calendar className="w-5 h-5 stroke-[2.5] text-[#1C1917]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
                    {title}
                  </h1>
                  {isToday && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-[#FEF08A] text-[#1C1917] border-2 border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] rounded-lg">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#78716C] mt-1 font-semibold">
                  {isWeeklyMaster
                    ? 'Master goals for the entire week. Assign to any day when you are ready.'
                    : dayDate
                    ? `${formatShortDate(dayDate)}, ${dayDate.getFullYear()} • Planned Architecture`
                    : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Quick completion count */}
          <div
            title={`Day Progress: ${tasks.filter((t) => Boolean(t.is_completed)).length} of ${tasks.length} tasks completed (${tasks.length > 0 ? Math.round((tasks.filter((t) => Boolean(t.is_completed)).length / tasks.length) * 100) : 0}%)`}
            className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs px-3.5 py-1.5 rounded-xl bg-[#BBF7D0] border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] text-[#1C1917] font-bold"
          >
            <div className="flex items-center gap-1.5">
              <span className="opacity-70 font-sans text-[11px] font-bold uppercase tracking-wider">Progress:</span>
              <span className="font-black">
                {tasks.filter((t) => Boolean(t.is_completed)).length}/{tasks.length}
              </span>
              {tasks.length > 0 && (
                <span className="text-[11px] opacity-75 font-mono">
                  ({Math.round((tasks.filter((t) => Boolean(t.is_completed)).length / tasks.length) * 100)}%)
                </span>
              )}
            </div>

            {/* Capsule Progress Bar */}
            {tasks.length > 0 && (
              <div className="w-16 sm:w-20 h-2.5 rounded-full border border-[#1C1917] bg-white overflow-hidden p-[1px] shadow-[0.5px_0.5px_0px_#1C1917]">
                <div
                  className="h-full rounded-full bg-[#16A34A] transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round((tasks.filter((t) => Boolean(t.is_completed)).length / tasks.length) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Time Budget Breakdown Banner (shown on daily views Mon to Sun) */}
        {!isWeeklyMaster ? (
          <div className="mt-5 pt-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Focus */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917]">
                  <Clock className="w-3.5 h-3.5 text-[#1C1917] shrink-0" />
                  <span className="text-[#78716C] font-medium">Focus:</span>
                  <span className="font-mono font-black text-[#1C1917]">
                    {formatDuration(dayStats.focusMinutes)}
                  </span>
                </div>

                {/* Breaks */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917]">
                  <Coffee className="w-3.5 h-3.5 text-[#1C1917] shrink-0" />
                  <span className="text-[#78716C] font-medium">Breaks:</span>
                  <span className="font-mono font-black text-[#1C1917]">
                    {formatDuration(dayStats.breakMinutes)}
                  </span>
                </div>

                {/* Total Budgeted */}
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C1917] text-[#FAF7F0] border-2 border-[#1C1917] shadow-[2px_2px_0px_#78716C]">
                  <span className="text-stone-300 font-medium">Total Budgeted:</span>
                  <span className="font-mono font-black text-[#FEF08A]">
                    {formatDuration(dayStats.totalMinutes)}
                  </span>
                </div>
              </div>

              {/* Interactive Category Time Split Pills */}
              {tasks.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {dayStats.careerFocusMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => handleToggleDayBreakdown('career')}
                      title="Click to see which Career / Study tasks take time today"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-[#1C1917] font-bold transition-all cursor-pointer ${
                        dayBreakdownCat === 'career'
                          ? 'bg-[#224A32] text-white shadow-none translate-x-0.5 translate-y-0.5'
                          : 'bg-[#BBF7D0] hover:bg-[#86EFAC] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                      }`}
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>Career:</span>
                      <span className="font-mono">{formatDuration(dayStats.careerFocusMinutes)}</span>
                    </button>
                  )}

                  {dayStats.collegeFocusMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => handleToggleDayBreakdown('college')}
                      title="Click to see which College / Assignment tasks take time today"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-[#1C1917] font-bold transition-all cursor-pointer ${
                        dayBreakdownCat === 'college'
                          ? 'bg-[#3E364E] text-white shadow-none translate-x-0.5 translate-y-0.5'
                          : 'bg-[#E9D5FF] hover:bg-[#D8B4FE] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>College:</span>
                      <span className="font-mono">{formatDuration(dayStats.collegeFocusMinutes)}</span>
                    </button>
                  )}

                  {dayStats.personalFocusMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => handleToggleDayBreakdown('personal')}
                      title="Click to see which Personal / Other tasks take time today"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-[#1C1917] font-bold transition-all cursor-pointer ${
                        dayBreakdownCat === 'personal'
                          ? 'bg-[#635032] text-white shadow-none translate-x-0.5 translate-y-0.5'
                          : 'bg-[#FDE68A] hover:bg-[#FCD34D] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Personal:</span>
                      <span className="font-mono">{formatDuration(dayStats.personalFocusMinutes)}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleDayBreakdown('all')}
                    title="Inspect where today's hours go by task"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-[#1C1917] font-bold transition-all cursor-pointer ${
                      dayBreakdownCat === 'all'
                        ? 'bg-[#FEF08A] text-[#1C1917] shadow-none translate-x-0.5 translate-y-0.5'
                        : 'bg-white hover:bg-[#FEF08A] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                    }`}
                  >
                    <PieChart className="w-3 h-3" />
                    <span>Time Split</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${dayBreakdownCat ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Expandable Daily Task Time Breakdown Drawer */}
            {dayBreakdownCat && tasks.length > 0 && (
              <div className="bg-[#FAF8F5] border-2 border-[#1C1917] rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917] space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1C1917]/15">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1917]">
                      Where Your {title} Time Goes
                    </h3>
                    <p className="text-[11px] text-[#78716C] font-medium">
                      Ranked by time cost so you can spot what to cut down or rebalance
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'career', label: 'Career' },
                      { id: 'college', label: 'College' },
                      { id: 'personal', label: 'Personal' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDayBreakdownCat(tab.id)}
                        className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          dayBreakdownCat === tab.id
                            ? 'bg-[#1C1917] text-[#FEF08A] border-[#1C1917]'
                            : 'bg-white text-[#57534E] hover:text-[#1C1917] border-[#1C1917]/30'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stacked Category Share Bar */}
                {dayStats.focusMinutes > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-3 rounded-full border-2 border-[#1C1917] bg-white overflow-hidden flex p-[1px]">
                      {dayStats.careerFocusMinutes > 0 && (
                        <div
                          style={{
                            width: `${Math.round((dayStats.careerFocusMinutes / dayStats.focusMinutes) * 100)}%`
                          }}
                          className="h-full bg-[#16A34A] transition-all duration-300"
                          title={`Career: ${formatDuration(dayStats.careerFocusMinutes)}`}
                        />
                      )}
                      {dayStats.collegeFocusMinutes > 0 && (
                        <div
                          style={{
                            width: `${Math.round((dayStats.collegeFocusMinutes / dayStats.focusMinutes) * 100)}%`
                          }}
                          className="h-full bg-[#7E22CE] transition-all duration-300"
                          title={`College: ${formatDuration(dayStats.collegeFocusMinutes)}`}
                        />
                      )}
                      {dayStats.personalFocusMinutes > 0 && (
                        <div
                          style={{
                            width: `${Math.round((dayStats.personalFocusMinutes / dayStats.focusMinutes) * 100)}%`
                          }}
                          className="h-full bg-[#D97706] transition-all duration-300"
                          title={`Personal: ${formatDuration(dayStats.personalFocusMinutes)}`}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[10px] font-mono font-bold text-[#57534E]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
                        Career: {Math.round((dayStats.careerFocusMinutes / dayStats.focusMinutes) * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#7E22CE] inline-block" />
                        College: {Math.round((dayStats.collegeFocusMinutes / dayStats.focusMinutes) * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#D97706] inline-block" />
                        Personal: {Math.round((dayStats.personalFocusMinutes / dayStats.focusMinutes) * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Per-Task Breakdown Rows */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {dayTasksSortedByTime.length === 0 ? (
                    <p className="text-xs text-[#78716C] py-2 text-center font-medium">
                      No tasks in this category for {title}.
                    </p>
                  ) : (
                    dayTasksSortedByTime.map((t, i) => {
                      const focus = t.duration_minutes ?? 30
                      const brk = t.break_minutes ?? 5
                      const totalT = focus + brk
                      const sharePct =
                        dayStats.totalMinutes > 0
                          ? Math.round((totalT / dayStats.totalMinutes) * 100)
                          : 0
                      const cat = normalizeCategory(t.tag)
                      const barFill =
                        cat === 'career'
                          ? 'bg-[#16A34A]'
                          : cat === 'college'
                          ? 'bg-[#7E22CE]'
                          : 'bg-[#D97706]'
                      return (
                        <div
                          key={t.id}
                          className="bg-white border border-[#1C1917] rounded-xl p-2.5 flex flex-col gap-1.5 shadow-[1.5px_1.5px_0px_#1C1917]"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] shrink-0">
                                #{i + 1}
                              </span>
                              <span
                                className={`font-bold text-[#1C1917] truncate ${
                                  t.is_completed ? 'line-through opacity-60' : ''
                                }`}
                              >
                                {t.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                              <span className="text-[11px] text-[#78716C]">
                                {formatDuration(focus)}
                                {brk > 0 ? ` + ${brk}m` : ''}
                              </span>
                              <span className="font-black text-[#1C1917] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#1C1917]/30">
                                {sharePct}% of day
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-stone-100 border border-[#1C1917]/30 overflow-hidden">
                            <div
                              style={{ width: `${Math.max(sharePct, 4)}%` }}
                              className={`h-full rounded-full ${barFill}`}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 pt-1 flex items-center justify-between text-xs text-[#78716C]">
            <span className="font-semibold italic">
              Weekly Master Milestones: High-level priorities for the week. Daily focus time is scheduled on Monday through Saturday.
            </span>
          </div>
        )}

        {/* SUNDAY SPECIFIC STUDY MONITOR & ALERT */}
        {isSunday && (
          <div className="mt-6 pt-5 border-t border-[#E5E0D8] space-y-3.5">
            {/* Sunday Career Study Cap Alert (> 4 hours) */}
            {isOverSundayStudy && (
              <div className="p-4 rounded-2xl bg-[#FDF2F0] border border-[#F5D5D0] text-[#9E362A] text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-[#C93B2B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#822419]">
                    Sunday Study Limit Exceeded! ({formatDuration(careerFocusMins)} budgeted)
                  </p>
                  <p className="text-xs text-[#9E362A]/90 leading-relaxed">
                    You have budgeted more than 4 hours of career study. Sunday is designed for light study and recharging—consider moving extra tasks into the week to avoid burnout!
                  </p>
                </div>
              </div>
            )}

            {/* Sunday Optimal Study Status */}
            {isInSundayStudyZone && (
              <div className="p-4 rounded-2xl bg-[#EBF2EC] border border-[#CFE1D3] text-[#224A32] text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[#224A32] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#183624]">
                    Optimal Sunday Study Zone ({formatDuration(careerFocusMins)})
                  </p>
                  <p className="text-xs text-[#224A32]/90">
                    Perfect! You are within your 3–4 hour career study target.
                  </p>
                </div>
              </div>
            )}

            {/* Sunday Study Breakdown Tags */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#224A32]" />
                  <span className="text-[#78716C]">Career Study (3-4h target):</span>
                  <span
                    className={`font-mono font-bold ${
                      isOverSundayStudy ? 'text-[#C93B2B]' : 'text-[#224A32]'
                    }`}
                  >
                    {formatDuration(careerFocusMins)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#3E364E]" />
                  <span className="text-[#78716C]">College/Assignment:</span>
                  <span className="font-mono font-semibold text-[#3E364E]">
                    {formatDuration(dayStats.collegeFocusMinutes || 0)}
                  </span>
                  <span className="text-[10px] text-[#A8A29E]">(Not counted in 3-4h cap)</span>
                </div>
              </div>

              <div className="text-[11px] text-[#78716C] flex items-center gap-1">
                <Info className="w-3 h-3 text-[#A8A29E]" />
                <span>Only "Career / Study" tasks count toward Sunday cap</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Tasks List — Positioned directly beneath the Day Header Card */}
      <div data-tour="task-list" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-[#1C1917] uppercase tracking-wider">
              {isWeeklyMaster
                ? 'Weekly Master Tasks'
                : isSunday
                ? 'Sunday Tasks'
                : `${title} Tasks`}
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border border-[#1C1917] rounded-md shadow-[1px_1px_0px_#1C1917] text-[#1C1917]">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
            {tasks.length > 1 && (
              <span className="hidden sm:inline text-[11px] text-[#78716C] font-semibold">
                • Hold or drag to rearrange
              </span>
            )}
          </div>

          {/* Quick Option on Weekly Milestones list to move unfinished tasks to another week */}
          {isWeeklyMaster && incompleteWeeklyTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setMoveToWeekData({ tasks: incompleteWeeklyTasks })}
              title="Move all unfinished weekly milestones to another week"
              aria-label="Move unfinished weekly milestones to another week"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] border-2 border-[#1C1917] text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Move Unfinished to Next Week ({incompleteWeeklyTasks.length})</span>
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center bg-white border-2 border-[#1C1917] rounded-3xl shadow-[3px_3px_0px_#1C1917] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF08A] text-[#1C1917] flex items-center justify-center mx-auto border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917]">
              <ListTodo className="w-6 h-6 stroke-[2.5]" />
            </div>
            <p className="text-base font-black text-[#1C1917]">No tasks planned yet</p>
            <p className="text-xs font-medium text-[#78716C] max-w-sm mx-auto leading-relaxed">
              {isWeeklyMaster
                ? 'Type in your high-level milestones for the entire week using the bar below. You can assign them to specific days later.'
                : `Plan your tasks for ${title} using the floating bar below. Choose your focus time, rest breaks, and category tags.`}
            </p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const isDragging = draggedItem?.id === task.id;
            const isTarget = dropTarget?.id === task.id && dropTarget?.listType === 'day';

            return (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                totalTasks={tasks.length}
                subTasks={getSubTasksForTask(task)}
                hasConnectedTasks={getHasConnectedTasks(task)}
                allMilestones={allMilestones}
                onRepeatAcrossDays={onRepeatAcrossDays}
                onToggle={onToggle}
                onMasterToggleRequest={handleMasterToggleRequest}
                onToggleSubTask={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDeleteSeries={onDeleteSeries}
                onMove={onMove}
                onOpenMoveToWeek={(t) => setMoveToWeekData({ tasks: [t] })}
                currentDay={selectedDay}
                isDraggable={true}
                isDragging={isDragging}
                dropPosition={isTarget ? dropTarget.position : null}
                onDragStart={(id) => handleDragStart(id, 'day')}
                onDragOver={(id, pos) => handleDragOver(id, pos, 'day')}
                onDragLeave={(id) => handleDragLeave(id, 'day')}
                onDrop={(id, pos) => handleDrop(id, pos, 'day')}
                onDragEnd={handleDragEnd}
                onMoveRelative={(dir) => handleMoveRelative(task.id, dir, 'day')}
              />
            );
          })
        )}
      </div>

      {/* SUNDAY SPECIAL: WEEKLY MILESTONES REVIEW SECTION */}
      {isSunday && (
        <div className="bg-white border-2 border-[#1C1917] rounded-3xl p-6 shadow-[4px_4px_0px_#1C1917] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b-2 border-[#1C1917]/15">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FEF08A] text-[#1C1917] border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] flex items-center justify-center">
                <ListTodo className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-black text-[#1C1917] tracking-tight text-sm sm:text-base">
                  Sunday Review: Weekly Milestones
                </h2>
                <p className="text-xs text-[#78716C] font-semibold">
                  Check off the big weekly goals you accomplished this week!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {incompleteWeeklyTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMoveToWeekData({ tasks: incompleteWeeklyTasks })}
                  title="Move unfinished weekly milestones to next week"
                  aria-label="Roll over unfinished milestones to next week"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] border-2 border-[#1C1917] text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Roll over {incompleteWeeklyTasks.length} to Next Week</span>
                </button>
              )}

              <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[#BBF7D0] border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] text-[#1C1917]">
                <span className="font-black">{completedWeeklyCount}</span>/
                <span>{weeklyTasks.length} Done</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {weeklyTasks.length === 0 ? (
              <p className="text-xs text-[#A8A29E] py-4 text-center font-medium">
                No weekly master milestones were created for this week.
              </p>
            ) : (
              weeklyTasks.map((task, index) => {
                const isDragging = draggedItem?.id === task.id;
                const isTarget = dropTarget?.id === task.id && dropTarget?.listType === 'weekly';

                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    totalTasks={weeklyTasks.length}
                    subTasks={getSubTasksForTask(task)}
                    hasConnectedTasks={getHasConnectedTasks(task)}
                    allMilestones={allMilestones}
                    onRepeatAcrossDays={onRepeatAcrossDays}
                    onToggle={onToggle}
                    onMasterToggleRequest={handleMasterToggleRequest}
                    onToggleSubTask={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDeleteSeries={onDeleteSeries}
                    onMove={onMove}
                    onOpenMoveToWeek={(t) => setMoveToWeekData({ tasks: [t] })}
                    currentDay={0}
                    isDraggable={true}
                    isDragging={isDragging}
                    dropPosition={isTarget ? dropTarget.position : null}
                    onDragStart={(id) => handleDragStart(id, 'weekly')}
                    onDragOver={(id, pos) => handleDragOver(id, pos, 'weekly')}
                    onDragLeave={(id) => handleDragLeave(id, 'weekly')}
                    onDrop={(id, pos) => handleDrop(id, pos, 'weekly')}
                    onDragEnd={handleDragEnd}
                    onMoveRelative={(dir) => handleMoveRelative(task.id, dir, 'weekly')}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* If Sunday is selected, include the Sunday Reflection Notepad */}
      {isSunday && (
        <div className="mt-1">
          <SundayCard weekStart={weekStart} />
        </div>
      )}

      {/* Floating Bottom Add Task Dock */}
      <div data-tour="add-task" className="sticky bottom-4 z-20 mt-auto pt-2 drop-shadow-xl">
        <AddTaskInput
          selectedDay={selectedDay}
          onAdd={(title, duration, breakMins, tag) =>
            onAdd(selectedDay, title, duration, breakMins, tag)
          }
          onAddBatch={onAddBatch}
          placeholder={
            isWeeklyMaster
              ? 'Add a master weekly milestone… (press Enter)'
              : `Add a task for ${title}… (press Enter)`
          }
        />
      </div>

      {/* Option 1: Confirmation Prompt for Master Milestone Completion */}
      <MasterCompletionModal
        isOpen={Boolean(pendingMasterCompletion)}
        onClose={() => setPendingMasterCompletion(null)}
        task={pendingMasterCompletion?.task}
        subTasks={pendingMasterCompletion?.subTasks}
        onPreserveHistory={handlePreserveHistory}
        onCompleteAll={handleCompleteAll}
      />

      {/* Modal for carrying / copying milestone(s) to another week with Mon-Sat schedule */}
      <MoveToWeekModal
        isOpen={Boolean(moveToWeekData)}
        onClose={() => setMoveToWeekData(null)}
        tasks={moveToWeekData?.tasks || []}
        currentWeekStart={weekStart}
        onCopyMilestones={onCopyMilestones || onMoveToWeek}
      />
    </div>
  )
}
