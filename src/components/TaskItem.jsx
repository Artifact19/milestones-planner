import { useState, useRef, useEffect } from 'react'
import {
  Circle,
  CheckCircle2,
  Pencil,
  Trash2,
  Clock,
  Coffee,
  Briefcase,
  BookOpen,
  Sparkles,
  Repeat,
  CalendarDays
} from 'lucide-react'
import { formatDuration, getDefaultBreakMinutes, TAG_OPTIONS, DAY_NAMES } from '../utils/dateUtils'

const DURATION_PRESETS = [
  { value: 15, label: '15m focus' },
  { value: 30, label: '30m focus' },
  { value: 45, label: '45m focus' },
  { value: 60, label: '1h focus' },
  { value: 90, label: '1.5h focus' },
  { value: 120, label: '2h focus' },
  { value: 150, label: '2.5h focus' },
  { value: 180, label: '3h focus' },
  { value: 240, label: '4h focus' },
  { value: 300, label: '5h focus' },
  { value: 360, label: '6h focus' },
  { value: 420, label: '7h focus' },
  { value: 480, label: '8h focus' },
  { value: 600, label: '10h focus' },
  { value: 720, label: '12h focus' }
]

const BREAK_PRESETS = [
  { value: 0, label: 'No break' },
  { value: 5, label: '5m break' },
  { value: 10, label: '10m break' },
  { value: 15, label: '15m break' },
  { value: 20, label: '20m break' },
  { value: 30, label: '30m break' },
  { value: 45, label: '45m break' },
  { value: 60, label: '1h break' }
]

const DAY_LETTERS = ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function TaskItem({
  task,
  subTasks = [],
  onToggle,
  onMasterToggleRequest,
  onToggleSubTask,
  onEdit,
  onDelete,
  onDeleteSeries,
  onMove,
  onOpenMoveToWeek,
  currentDay
}) {
  const isWeeklyMilestone = task.day_of_week === 0 || currentDay === 0
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.title)
  const [editDuration, setEditDuration] = useState(task.duration_minutes ?? 30)
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const [editBreak, setEditBreak] = useState(task.break_minutes ?? 5)
  const [editTag, setEditTag] = useState(task.tag || 'career')
  const inputRef = useRef(null)
  // Shows the "just this one / all following" choice for repeating tasks
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isRepeating = Boolean(task.series_id)

  // Master task and sub-tasks calculations
  const hasSubTasks = task.day_of_week === 0 && subTasks && subTasks.length > 0
  const completedSubTasks = hasSubTasks ? subTasks.filter((s) => s.is_completed).length : 0
  const totalSubTasks = hasSubTasks ? subTasks.length : 0
  const percentSubTasks = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0
  const allSubTasksDone = hasSubTasks && completedSubTasks === totalSubTasks

  const handleCheckboxClick = () => {
    if (task.is_completed) {
      // Unchecking simply marks incomplete without altering daily records
      onToggle(task.id)
    } else if (hasSubTasks && onMasterToggleRequest && completedSubTasks < totalSubTasks) {
      // Has incomplete daily sessions: open confirmation prompt
      onMasterToggleRequest(task, subTasks)
    } else {
      // Direct completion
      onToggle(task.id)
    }
  }

  const handleDeleteClick = () => {
    if (isRepeating && onDeleteSeries) {
      setConfirmDelete(true)
    } else {
      onDelete(task.id)
    }
  }

  useEffect(() => {
    setEditText(task.title)
    setEditDuration(task.duration_minutes ?? 30)
    setEditBreak(task.break_minutes ?? 5)
    setEditTag(task.tag || 'career')
  }, [task])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setIsCustomDuration(!DURATION_PRESETS.some((p) => p.value === (task.duration_minutes ?? 30)))
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed) {
      const finalDuration = Math.max(1, Math.min(1440, Number(editDuration) || 30))
      const finalBreak = Math.max(0, Math.min(240, Number(editBreak) || 0))
      onEdit(task.id, {
        title: trimmed,
        duration_minutes: finalDuration,
        break_minutes: finalBreak,
        tag: editTag
      })
    }
    setIsEditing(false)
    setIsCustomDuration(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditText(task.title)
      setEditDuration(task.duration_minutes ?? 30)
      setEditBreak(task.break_minutes ?? 5)
      setIsEditing(false)
      setIsCustomDuration(false)
    }
  }

  const tagObj = TAG_OPTIONS.find((t) => t.id === (task.tag || 'career')) || TAG_OPTIONS[0]
  const totalItemMinutes = (task.duration_minutes ?? 30) + (task.break_minutes ?? 5)

  return (
    <div
      className={`group flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-all duration-150 ${
        task.is_completed
          ? 'bg-[#FAF8F5]/60 border-[#E5E0D8]/60 text-stone-400'
          : 'bg-white hover:bg-[#FAF8F5]/50 border-[#E5E0D8] text-[#1C1917] shadow-sm hover:shadow-[0_4px_16px_rgba(28,25,23,0.03)]'
      }`}
    >
      {isEditing ? (
        <div className="flex items-start gap-3 w-full">
          <button
            type="button"
            disabled
            className="shrink-0 mt-1 text-[#A8A29E] cursor-default rounded-full p-0.5 opacity-40"
          >
            <Circle className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              className="w-full bg-white border border-[#1C1917] rounded-xl px-3 py-1.5 text-sm text-[#1C1917] focus:outline-none"
            />
            {/* Quick inline edit for Tag, Duration, Break */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1 text-[#44403C] focus:outline-none cursor-pointer"
              >
                {TAG_OPTIONS.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>

              {isCustomDuration ? (
                <div className="flex items-center gap-1 bg-white border border-[#E5E0D8] rounded-lg px-2 py-0.5">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    step={1}
                    value={editDuration}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') {
                        setEditDuration('')
                      } else {
                        const parsed = parseInt(val, 10)
                        setEditDuration(isNaN(parsed) ? '' : Math.max(0, Math.min(1440, parsed)))
                      }
                    }}
                    onBlur={() => {
                      if (editDuration === '' || Number(editDuration) < 1) {
                        setEditDuration(task.duration_minutes || 30)
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="w-14 text-[#44403C] font-mono text-xs focus:outline-none"
                  />
                  <span className="text-[11px] text-[#78716C] font-mono">min</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false)
                      setEditDuration(task.duration_minutes || 30)
                    }}
                    title="Switch back to presets"
                    className="text-stone-400 hover:text-stone-700 text-xs px-1 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={DURATION_PRESETS.some((p) => p.value === editDuration) ? editDuration : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomDuration(true)
                    } else {
                      const val = Number(e.target.value)
                      setEditDuration(val)
                      setEditBreak(getDefaultBreakMinutes(val))
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1 text-[#44403C] focus:outline-none cursor-pointer"
                >
                  {DURATION_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">
                    {DURATION_PRESETS.some((p) => p.value === editDuration)
                      ? '✏️ Custom…'
                      : `✏️ Custom (${formatDuration(editDuration)})`}
                  </option>
                </select>
              )}

              <select
                value={BREAK_PRESETS.some((p) => p.value === editBreak) ? editBreak : 5}
                onChange={(e) => setEditBreak(Number(e.target.value))}
                onKeyDown={handleKeyDown}
                className="bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1 text-[#44403C] focus:outline-none cursor-pointer"
              >
                {BREAK_PRESETS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-[#1C1917] hover:bg-black text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Primary Line: Checkbox + Full Width Title */}
          <div className="flex items-start gap-3 w-full">
            <button
              type="button"
              onClick={handleCheckboxClick}
              aria-label={task.is_completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
              aria-pressed={task.is_completed}
              className={`shrink-0 mt-0.5 transition-colors cursor-pointer rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
                task.is_completed
                  ? 'text-[#224A32]'
                  : 'text-[#A8A29E] hover:text-[#1C1917]'
              }`}
            >
              {task.is_completed ? (
                <CheckCircle2 className="w-5 h-5 fill-[#224A32]/10" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>

            <span
              onDoubleClick={handleStartEdit}
              title="Double-click to edit"
              className={`text-sm select-none cursor-pointer font-medium leading-relaxed break-words flex-1 min-w-0 ${
                task.is_completed ? 'line-through text-stone-400' : 'text-[#1C1917]'
              }`}
            >
              {task.title}
            </span>
          </div>

          {/* Bottom Secondary Line: Badges (Left) + Actions (Right) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pl-8 pt-0.5">
            {/* Left section: Metadata Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Tag Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tagObj.badgeClass}`}
              >
                {tagObj.id === 'career' && <Briefcase className="w-3 h-3" />}
                {tagObj.id === 'college' && <BookOpen className="w-3 h-3" />}
                {tagObj.id === 'personal' && <Sparkles className="w-3 h-3" />}
                <span>{tagObj.shortLabel}</span>
              </span>

              {/* Repeating indicator for daily tasks */}
              {isRepeating && !hasSubTasks && (
                <span
                  title="Daily session of a repeating weekly routine"
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E5E0D8] text-[#57534E]"
                >
                  <Repeat className="w-3 h-3 text-[#224A32]" />
                  <span>Weekly Routine</span>
                </span>
              )}

              {/* Master Task Sub-Task Sessions Progress Badge */}
              {hasSubTasks && (
                <span
                  title={`Master milestone with ${totalSubTasks} daily execution sessions`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF2EC] border border-[#CFE1D3] text-[#224A32]"
                >
                  <Repeat className="w-3 h-3 text-[#224A32]" />
                  <span>{completedSubTasks}/{totalSubTasks} sessions ({percentSubTasks}%)</span>
                </span>
              )}

              {/* Time Badge (Clean & Concise: no redundant '(= 15m)') */}
              {!isWeeklyMilestone && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E]"
                  title={`${formatDuration(task.duration_minutes ?? 30)} focus${(task.break_minutes ?? 0) > 0 ? ` + ${formatDuration(task.break_minutes)} rest` : ''}`}
                >
                  <Clock className="w-3 h-3 text-[#224A32] shrink-0" />
                  <span>{formatDuration(task.duration_minutes ?? 30)}</span>
                  {(task.break_minutes ?? 0) > 0 && (
                    <span className="text-stone-400 flex items-center gap-0.5">
                      +<Coffee className="w-2.5 h-2.5 shrink-0" />
                      {formatDuration(task.break_minutes)}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Right section: Move to Day / Edit / Delete */}
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[#78716C] mr-1 font-medium">Delete repeating task:</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false)
                    onDelete(task.id)
                  }}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#1C1917] font-medium cursor-pointer shadow-sm"
                >
                  Just this one
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false)
                    onDeleteSeries(task.series_id, task.day_of_week)
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#9E362A] hover:bg-[#822419] text-white font-medium cursor-pointer shadow-sm"
                >
                  This & all following days
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Direct 1-click option to carry forward weekly milestone to another week */}
                {onOpenMoveToWeek && task.day_of_week === 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenMoveToWeek(task)}
                    aria-label="Carry milestone to another week"
                    title="Carry forward this milestone to another week (schedules on Mon–Sat & preserves history)"
                    className="flex items-center gap-1 text-[11px] font-semibold bg-white hover:bg-[#1C1917] hover:text-white border border-[#E5E0D8] hover:border-[#1C1917] text-[#44403C] rounded-full px-2.5 py-1 transition-all shadow-xs cursor-pointer group"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-[#224A32] group-hover:text-white transition-colors" />
                    <span className="hidden sm:inline">Carry to Week</span>
                    <span className="sm:hidden">Carry</span>
                  </button>
                )}

                <select
                  value={task.day_of_week}
                  onChange={(e) => {
                    if (e.target.value === 'move-week') {
                      if (onOpenMoveToWeek) onOpenMoveToWeek(task)
                    } else if (onMove) {
                      onMove(task.id, Number(e.target.value))
                    }
                  }}
                  aria-label="Assign to day"
                  title="Move or assign this task"
                  className="text-[11px] bg-white border border-[#E5E0D8] hover:border-[#1C1917] rounded-full px-2.5 py-1 text-[#44403C] focus:outline-none cursor-pointer shadow-sm transition-colors"
                >
                  <option value={0}>📋 Weekly List</option>
                  <option value={1}>Mon</option>
                  <option value={2}>Tue</option>
                  <option value={3}>Wed</option>
                  <option value={4}>Thu</option>
                  <option value={5}>Fri</option>
                  <option value={6}>Sat</option>
                  <option value={7}>Sun</option>
                  <option value="move-week">🗓️ Carry to another week…</option>
                </select>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  aria-label="Edit task"
                  title="Edit task (double-click also works)"
                  className="p-1.5 rounded-full text-stone-400 hover:text-[#1C1917] hover:bg-white transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  aria-label="Delete task"
                  title="Delete task"
                  className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Option 1: Live Sub-Task Progress & Interactive Day Pills on Master Card */}
      {hasSubTasks && (
        <div className="w-full pt-2.5 mt-0.5 border-t border-[#E5E0D8]/70 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#57534E] uppercase tracking-wider">
                Daily Execution:
              </span>
              <span className="text-[11px] font-mono font-medium text-[#78716C]">
                {completedSubTasks} of {totalSubTasks} logged
              </span>
            </div>

            {/* Clickable segmented day pills */}
            <div className="flex flex-wrap items-center gap-1">
              {subTasks.map((st) => {
                const isDone = st.is_completed
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleSubTask) onToggleSubTask(st.id)
                      else onToggle(st.id)
                    }}
                    title={`${DAY_NAMES[st.day_of_week]}: ${
                      isDone ? 'Completed (Click to uncheck)' : 'Pending (Click to mark done)'
                    }`}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                      isDone
                        ? 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32] hover:bg-[#DEE8DA]'
                        : 'bg-white hover:bg-[#FAF8F5] border-[#E5E0D8] text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    <span>{DAY_LETTERS[st.day_of_week]}</span>
                    <span>{isDone ? '✓' : '·'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mini Visual Meter Bar */}
          <div className="w-full bg-[#E5E0D8]/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#224A32] h-full rounded-full transition-all duration-300"
              style={{ width: `${percentSubTasks}%` }}
            />
          </div>

          {/* Subtle Celebratory Banner when all sessions are completed but milestone is still pending */}
          {allSubTasksDone && !task.is_completed && (
            <div className="pt-2 border-t border-[#E5E0D8]/60 flex flex-wrap items-center justify-between gap-2 bg-[#EBF2EC]/70 border border-[#CFE1D3] rounded-xl px-3 py-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-[#224A32] font-semibold">
                <Sparkles className="w-4 h-4 text-[#224A32] shrink-0" />
                <span>All {totalSubTasks} daily sessions completed! Mark weekly milestone finished?</span>
              </div>
              <button
                type="button"
                onClick={() => onToggle(task.id)}
                className="px-3 py-1 rounded-full bg-[#224A32] hover:bg-[#183624] text-white font-semibold text-xs cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Milestone Complete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
