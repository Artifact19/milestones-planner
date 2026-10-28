import { useState, useRef, useEffect } from 'react'
import {
  Check,
  Pencil,
  Trash2,
  Clock,
  Coffee,
  Briefcase,
  BookOpen,
  Sparkles,
  Repeat,
  CalendarDays,
  GripVertical,
  ChevronUp,
  ChevronDown
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
  index = 0,
  totalTasks = 1,
  subTasks = [],
  hasConnectedTasks: hasConnectedTasksProp,
  onToggle,
  onMasterToggleRequest,
  onToggleSubTask,
  onEdit,
  onDelete,
  onDeleteSeries,
  onMove,
  onOpenMoveToWeek,
  currentDay,
  isDraggable = true,
  isDragging = false,
  dropPosition = null,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveRelative
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
  const isConnectedSeries =
    typeof hasConnectedTasksProp === 'boolean'
      ? hasConnectedTasksProp
      : isRepeating || task.day_of_week === 0 || hasSubTasks
  const [updateEntireWeek, setUpdateEntireWeek] = useState(true)
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

  
  const handleCapsuleDoubleClick = (e) => {
    if (isEditing) return;
    // Don't trigger edit if user double clicked an interactive element
    if (e.target.closest('button, select, input, textarea, a, [data-no-edit]')) {
      return;
    }
    handleStartEdit();
  };

  const handleStartEdit = () => {
    setIsCustomDuration(!DURATION_PRESETS.some((p) => p.value === (task.duration_minutes ?? 30)))
    setUpdateEntireWeek(true)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed) {
      const finalDuration = Math.max(1, Math.min(1440, Number(editDuration) || 30))
      const finalBreak = Math.max(0, Math.min(240, Number(editBreak) || 0))
      onEdit(
        task.id,
        {
          title: trimmed,
          duration_minutes: finalDuration,
          break_minutes: finalBreak,
          tag: editTag
        },
        { updateEntireWeek: isConnectedSeries && updateEntireWeek }
      )
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

  return (
    <div
      data-task-id={task.id}
      draggable={isDraggable && !isEditing}
      onDoubleClick={handleCapsuleDoubleClick}
      onDragStart={(e) => {
        if (isEditing) {
          e.preventDefault();
          return;
        }
        if (e.target.closest('button, select, input, textarea, a, [data-no-drag]')) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        if (onDragStart) onDragStart(task.id);
      }}
      onDragOver={(e) => {
        if (!isDraggable || isEditing) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const isTop = e.clientY < rect.top + rect.height / 2;
        if (onDragOver) onDragOver(task.id, isTop ? 'above' : 'below');
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          if (onDragLeave) onDragLeave(task.id);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const isTop = e.clientY < rect.top + rect.height / 2;
        if (onDrop) onDrop(task.id, isTop ? 'above' : 'below');
      }}
      onDragEnd={() => {
        if (onDragEnd) onDragEnd();
      }}
      onKeyDown={(e) => {
        if (isEditing) return;
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          if (onMoveRelative) onMoveRelative(-1);
        } else if (e.altKey && e.key === 'ArrowDown') {
          e.preventDefault();
          if (onMoveRelative) onMoveRelative(1);
        }
      }}
      tabIndex={isEditing ? -1 : 0}
      title={isEditing ? undefined : 'Double-click anywhere to edit • Hold to rearrange'}
      className={`group relative flex flex-col gap-2 p-3 sm:p-3.5 rounded-2xl border-2 border-[#1C1917] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] ${
        isDragging
          ? 'opacity-40 scale-[0.99] border-dashed bg-[#FEF08A]/30 shadow-none'
          : task.is_completed
          ? 'bg-[#F5F5F0] border-[#1C1917]/30 text-stone-400 shadow-[1.5px_1.5px_0px_#1C1917]/20'
          : 'bg-white text-[#1C1917] shadow-[3px_3px_0px_#1C1917] hover:shadow-[4px_4px_0px_#1C1917] hover:-translate-x-0.5 hover:-translate-y-0.5'
      }`}
    >
      {/* Drop slot indicator bar when dragging above */}
      {dropPosition === 'above' && !isDragging && (
        <div className="absolute -top-1.5 left-2 right-2 z-30 pointer-events-none flex items-center justify-between animate-in fade-in zoom-in-95 duration-100">
          <div className="w-2 h-2 rounded-full bg-[#1C1917] ring-2 ring-white shadow-xs" />
          <div className="h-1 flex-1 bg-[#1C1917] rounded-full mx-0.5 shadow-xs" />
          <div className="w-2 h-2 rounded-full bg-[#1C1917] ring-2 ring-white shadow-xs" />
        </div>
      )}

      {/* Drop slot indicator bar when dragging below */}
      {dropPosition === 'below' && !isDragging && (
        <div className="absolute -bottom-1.5 left-2 right-2 z-30 pointer-events-none flex items-center justify-between animate-in fade-in zoom-in-95 duration-100">
          <div className="w-2 h-2 rounded-full bg-[#1C1917] ring-2 ring-white shadow-xs" />
          <div className="h-1 flex-1 bg-[#1C1917] rounded-full mx-0.5 shadow-xs" />
          <div className="w-2 h-2 rounded-full bg-[#1C1917] ring-2 ring-white shadow-xs" />
        </div>
      )}
      {isEditing ? (
        <div className="flex items-start gap-3 w-full">
          <div className="shrink-0 mt-1 w-5 h-5 rounded-md border-2 border-[#1C1917]/30 bg-stone-100 opacity-50" />
          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              className="w-full bg-[#F8F6F0] border-2 border-[#1C1917] rounded-xl px-3 py-1.5 text-sm font-bold text-[#1C1917] focus:outline-none focus:bg-white shadow-[2px_2px_0px_#1C1917]"
            />
            {/* Quick inline edit for Tag, Duration, Break */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-white border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1C1917] focus:outline-none cursor-pointer"
              >
                {TAG_OPTIONS.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>

              {isCustomDuration ? (
                <div className="flex items-center gap-1 bg-white border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] rounded-lg px-2 py-0.5">
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
                    className="w-14 text-[#1C1917] font-mono text-xs font-bold focus:outline-none"
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
                  className="bg-white border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1C1917] focus:outline-none cursor-pointer"
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
                className="bg-white border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1C1917] focus:outline-none cursor-pointer"
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
                className="px-3.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917] border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] font-bold rounded-lg text-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-white hover:bg-stone-100 text-[#1C1917] border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] font-bold rounded-lg text-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Option to sync edit across entire week */}
            {isConnectedSeries && (
              <div className="flex items-center gap-2 pt-1.5 border-t-2 border-[#1C1917]/10">
                <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateEntireWeek}
                    onChange={(e) => setUpdateEntireWeek(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[#1C1917] text-[#1C1917] accent-[#1C1917] cursor-pointer"
                  />
                  <span>
                    {task.day_of_week === 0
                      ? 'Update across entire week (all allocated daily sessions)'
                      : 'Update across entire week (Weekly Milestone & all daily routines)'}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Top Primary Line: Grip Handle + Checkbox + Full Width Title */}
          <div className="flex items-start gap-2.5 w-full">
            {!isEditing && (
              <div
                data-drag-handle
                onTouchStart={() => {
                  if (onDragStart) onDragStart(task.id);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const el = document.elementFromPoint(touch.clientX, touch.clientY);
                  const taskEl = el?.closest('[data-task-id]');
                  if (taskEl) {
                    const targetId = taskEl.getAttribute('data-task-id');
                    const rect = taskEl.getBoundingClientRect();
                    const isTop = touch.clientY < rect.top + rect.height / 2;
                    if (onDragOver) onDragOver(targetId, isTop ? 'above' : 'below');
                  }
                }}
                onTouchEnd={() => {
                  if (onDrop) onDrop();
                  if (onDragEnd) onDragEnd();
                }}
                className="shrink-0 mt-0.5 -ml-1 text-stone-300 group-hover:text-stone-600 hover:!text-[#1C1917] cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-[#FAF8F5] transition-colors flex items-center justify-center select-none touch-none"
                title="Hold and drag to move task up or down"
                aria-label="Drag handle to reorder task"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckboxClick}
              aria-label={task.is_completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
              aria-pressed={task.is_completed}
              className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 border-[#1C1917] flex items-center justify-center transition-all cursor-pointer ${
                task.is_completed
                  ? 'bg-[#22C55E] text-white shadow-[1px_1px_0px_#1C1917]'
                  : 'bg-white hover:bg-[#FEF08A] shadow-[2px_2px_0px_#1C1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <span
              onDoubleClick={handleStartEdit}
              title="Double-click to edit"
              className={`text-sm select-none cursor-pointer font-bold leading-relaxed break-words flex-1 min-w-0 ${
                task.is_completed ? 'line-through text-stone-400 font-medium' : 'text-[#1C1917]'
              }`}
            >
              {task.title}
            </span>
          </div>

          {/* Bottom Secondary Line: Badges (Left) + Actions (Right) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pl-7.5 pt-0.5">
            {/* Left section: Metadata Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Tag Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#1C1917] shadow-[1px_1px_0px_#1C1917] ${tagObj.badgeClass}`}
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
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FEF08A] border border-[#1C1917] shadow-[1px_1px_0px_#1C1917] text-[#1C1917]"
                >
                  <Repeat className="w-3 h-3" />
                  <span>Weekly Routine</span>
                </span>
              )}

              {/* Master Task Sub-Task Sessions Progress Badge */}
              {hasSubTasks && (
                <span
                  title={`Master milestone with ${totalSubTasks} daily execution sessions`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#BBF7D0] border border-[#1C1917] shadow-[1px_1px_0px_#1C1917] text-[#166534]"
                >
                  <Repeat className="w-3 h-3" />
                  <span>{completedSubTasks}/{totalSubTasks} sessions ({percentSubTasks}%)</span>
                </span>
              )}

              {/* Time Badge */}
              {!isWeeklyMilestone && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#1C1917] shadow-[1px_1px_0px_#1C1917] text-[#1C1917]"
                  title={`${formatDuration(task.duration_minutes ?? 30)} focus${(task.break_minutes ?? 0) > 0 ? ` + ${formatDuration(task.break_minutes)} rest` : ''}`}
                >
                  <Clock className="w-3 h-3 text-[#1C1917] shrink-0" />
                  <span>{formatDuration(task.duration_minutes ?? 30)}</span>
                  {(task.break_minutes ?? 0) > 0 && (
                    <span className="text-[#78716C] flex items-center gap-0.5">
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
                <span className="text-[#1C1917] mr-1 font-bold">Delete repeating task:</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false)
                    onDelete(task.id)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-[#1C1917] text-[#1C1917] font-bold shadow-[1px_1px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  Just this one
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false)
                    onDeleteSeries(task.series_id, task.day_of_week)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#FECDD3] hover:bg-[#FDA4AF] border border-[#1C1917] text-[#9F1239] font-bold shadow-[1px_1px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  This & following days
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-stone-500 hover:text-[#1C1917] font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Accessible / 1-click Move Up / Move Down buttons */}
                {onMoveRelative && totalTasks > 1 && (
                  <div className="flex items-center border border-[#1C1917] bg-white rounded-lg shadow-[1px_1px_0px_#1C1917] overflow-hidden">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveRelative(-1)}
                      aria-label="Move task up"
                      title="Move task up (Alt+Up)"
                      className="p-1 text-stone-500 hover:text-[#1C1917] hover:bg-[#FEF08A] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <ChevronUp className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <div className="w-[1px] h-3 bg-[#1C1917]/20" />
                    <button
                      type="button"
                      disabled={index === totalTasks - 1}
                      onClick={() => onMoveRelative(1)}
                      aria-label="Move task down"
                      title="Move task down (Alt+Down)"
                      className="p-1 text-stone-500 hover:text-[#1C1917] hover:bg-[#FEF08A] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {/* Direct 1-click option to carry forward weekly milestone to another week */}
                {onOpenMoveToWeek && task.day_of_week === 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenMoveToWeek(task)}
                    aria-label="Carry milestone to another week"
                    title="Carry forward this milestone to another week (schedules on Mon–Sat & preserves history)"
                    className="flex items-center gap-1 text-[11px] font-bold bg-[#FEF08A] hover:bg-[#FDE047] border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] text-[#1C1917] rounded-lg px-2 py-0.5 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    <CalendarDays className="w-3 h-3" />
                    <span>Carry</span>
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
                  className="text-[11px] font-bold bg-white border border-[#1C1917] hover:bg-[#FEF08A] shadow-[1.5px_1.5px_0px_#1C1917] rounded-lg px-1.5 py-0.5 text-[#1C1917] focus:outline-none cursor-pointer transition-all"
                >
                  <option value={0}>📋 Wk</option>
                  <option value={1}>Mon</option>
                  <option value={2}>Tue</option>
                  <option value={3}>Wed</option>
                  <option value={4}>Thu</option>
                  <option value={5}>Fri</option>
                  <option value={6}>Sat</option>
                  <option value={7}>Sun</option>
                  <option value="move-week">🗓️ Carry…</option>
                </select>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  aria-label="Edit task"
                  title="Edit task (double-click also works)"
                  className="p-1 rounded-lg border border-[#1C1917] bg-white text-[#1C1917] hover:bg-[#FEF08A] shadow-[1.5px_1.5px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  aria-label="Delete task"
                  title="Delete task"
                  className="p-1 rounded-lg border border-[#1C1917] bg-white text-[#1C1917] hover:bg-[#FECDD3] shadow-[1.5px_1.5px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
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
