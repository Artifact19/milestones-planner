
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
  Home,
  CalendarDays
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
  isSameWeek
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
  tasks = [],
  weeklyTasks = [],
  allMilestones = [],
  dayStats,
  onToggle,
  onEdit,
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
  const isToday =
    selectedDay === todayDayNumber && isSameWeek(weekStart, getMonday(new Date()))

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

  const getSubTasksForTask = (task) => {
    if (!task?.series_id || task.day_of_week !== 0) return []
    return allMilestones
      .filter((m) => m.series_id === task.series_id && m.day_of_week > 0)
      .sort((a, b) => a.day_of_week - b.day_of_week)
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
      {/* Top Day Stepper & Home Navigation Pill */}
      <div className="flex items-center justify-between gap-2 bg-white/75 backdrop-blur-md border border-[#E5E0D8] rounded-full px-3 py-1.5 shadow-[0_4px_16px_rgba(28,25,23,0.03)] text-xs">
        <button
          type="button"
          onClick={onPrevDay}
          aria-label="Previous day"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] hover:bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] transition-all cursor-pointer font-medium shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous Day</span>
        </button>

        <button
          type="button"
          onClick={onGoHome}
          title="Go to Today (Homepage)"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium border transition-all cursor-pointer ${
            isToday
              ? 'bg-[#1C1917] border-[#1C1917] text-white font-semibold shadow-sm'
              : 'bg-white hover:bg-[#FAF8F5] border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] shadow-sm'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Today</span>
          <span className="hidden sm:inline"> (Homepage)</span>
        </button>

        <button
          type="button"
          onClick={onNextDay}
          aria-label="Next day"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] hover:bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] transition-all cursor-pointer font-medium shadow-sm"
        >
          <span className="hidden sm:inline">Next Day</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Architectural Workspace Card */}
      <div className="bg-white/90 backdrop-blur-md border border-[#E5E0D8] rounded-3xl p-5 sm:p-8 shadow-[0_12px_36px_-6px_rgba(28,25,23,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D8]">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${
                  isSunday
                    ? 'bg-[#F4ECE1] border-[#E8DAC5] text-[#695431]'
                    : isWeeklyMaster
                    ? 'bg-[#1C1917] border-[#1C1917] text-white'
                    : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#1C1917]'
                }`}
              >
                {isSunday ? (
                  <Sun className="w-5 h-5" />
                ) : isWeeklyMaster ? (
                  <ListTodo className="w-5 h-5" />
                ) : (
                  <Calendar className="w-5 h-5 text-[#1C1917]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                    {title}
                  </h1>
                  {isToday && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#EBF2EC] text-[#224A32] border border-[#CFE1D3] rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#78716C] mt-1 font-medium">
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
          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E] shadow-sm">
            <span className="text-stone-400">Tasks:</span>
            <span className="text-[#1C1917] font-bold">
              {tasks.filter((t) => Boolean(t.is_completed)).length}
            </span>
            <span className="text-stone-300">/</span>
            <span className="text-[#78716C] font-semibold">{tasks.length}</span>
          </div>
        </div>

        {/* Time Budget Breakdown Banner (shown on daily views Mon to Sun) */}
        {!isWeeklyMaster ? (
          <div className="mt-5 pt-1 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Focus */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8]">
                <Clock className="w-3.5 h-3.5 text-[#224A32] shrink-0" />
                <span className="text-[#78716C]">Focus:</span>
                <span className="font-mono font-bold text-[#1C1917]">
                  {formatDuration(dayStats.focusMinutes)}
                </span>
              </div>

              {/* Breaks */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8]">
                <Coffee className="w-3.5 h-3.5 text-[#695431] shrink-0" />
                <span className="text-[#78716C]">Breaks:</span>
                <span className="font-mono font-bold text-[#1C1917]">
                  {formatDuration(dayStats.breakMinutes)}
                </span>
              </div>

              {/* Total Budgeted */}
              <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1C1917] text-white shadow-sm">
                <span className="text-stone-300">Total Budgeted:</span>
                <span className="font-mono font-bold text-[#FAF8F5]">
                  {formatDuration(dayStats.totalMinutes)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-1 flex items-center justify-between text-xs text-[#78716C]">
            <span className="font-serif italic">
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
              {isWeeklyMaster
                ? 'Weekly Master Tasks'
                : isSunday
                ? 'Sunday Tasks'
                : `${title} Tasks`}
            </span>
            <span className="text-xs text-[#A8A29E] font-mono">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
            {tasks.length > 1 && (
              <span className="hidden sm:inline text-[11px] text-[#A8A29E] font-normal">
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
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#1C1917] hover:text-white border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#224A32] group-hover:text-white transition-colors" />
              <span>Move Unfinished to Next Week ({incompleteWeeklyTasks.length})</span>
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center bg-white/70 border border-[#E5E0D8] rounded-3xl space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-stone-400 flex items-center justify-center mx-auto border border-[#E5E0D8]">
              <ListTodo className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#1C1917]">No tasks planned yet</p>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed">
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
        <div className="bg-white/90 border border-[#E5E0D8] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center shadow-sm">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1C1917] tracking-tight text-sm sm:text-base">
                  Sunday Review: Weekly Milestones
                </h2>
                <p className="text-xs text-[#78716C]">
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
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#1C1917] hover:text-white border border-[#E5E0D8] hover:border-[#1C1917] text-[#1C1917] text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-[#224A32] group-hover:text-white transition-colors" />
                  <span>Roll over {incompleteWeeklyTasks.length} to Next Week</span>
                </button>
              )}

              <div className="text-xs font-mono px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#44403C] font-semibold">
                <span className="text-[#224A32]">{completedWeeklyCount}</span>/
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
      <div className="sticky bottom-4 z-20 mt-auto pt-2 drop-shadow-xl">
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
