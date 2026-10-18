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
  Repeat
} from 'lucide-react'
import { formatDuration, TAG_OPTIONS } from '../utils/dateUtils'

export default function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onDeleteSeries,
  onMove
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.title)
  const [editDuration, setEditDuration] = useState(task.duration_minutes ?? 30)
  const [editBreak, setEditBreak] = useState(task.break_minutes ?? 5)
  const [editTag, setEditTag] = useState(task.tag || 'career')
  const inputRef = useRef(null)
  // Shows the "just this one / all following" choice for repeating tasks
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isRepeating = Boolean(task.series_id)

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
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed) {
      onEdit(task.id, {
        title: trimmed,
        duration_minutes: Number(editDuration),
        break_minutes: Number(editBreak),
        tag: editTag
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditText(task.title)
      setIsEditing(false)
    }
  }

  const tagObj = TAG_OPTIONS.find((t) => t.id === (task.tag || 'career')) || TAG_OPTIONS[0]
  const totalItemMinutes = (task.duration_minutes ?? 30) + (task.break_minutes ?? 5)

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl border transition-all duration-150 ${
        task.is_completed
          ? 'bg-[#FAF8F5]/60 border-[#E5E0D8]/60 text-stone-400'
          : 'bg-white hover:bg-[#FAF8F5]/50 border-[#E5E0D8] text-[#1C1917] shadow-sm hover:shadow-[0_4px_16px_rgba(28,25,23,0.03)]'
      }`}
    >
      {/* Left section: Checkbox & Info */}
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-label={task.is_completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
          aria-pressed={task.is_completed}
          className={`shrink-0 mt-0.5 sm:mt-0 transition-colors cursor-pointer rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
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

        {isEditing ? (
          <div className="flex flex-col gap-2 w-full">
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
                className="bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1 text-[#44403C] focus:outline-none"
              >
                {TAG_OPTIONS.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>

              <select
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value))}
                className="bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1 text-[#44403C] focus:outline-none"
              >
                <option value={15}>15m focus</option>
                <option value={30}>30m focus</option>
                <option value={45}>45m focus</option>
                <option value={60}>1h focus</option>
                <option value={90}>1.5h focus</option>
                <option value={120}>2h focus</option>
                <option value={180}>3h focus</option>
              </select>

              <select
                value={editBreak}
                onChange={(e) => setEditBreak(Number(e.target.value))}
                className="bg-white border border-[#E5E0D8] rounded-lg px-2.5 py-1 text-[#44403C] focus:outline-none"
              >
                <option value={0}>No break</option>
                <option value={5}>5m break</option>
                <option value={10}>10m break</option>
                <option value={15}>15m break</option>
                <option value={20}>20m break</option>
                <option value={30}>30m break</option>
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
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span
              onDoubleClick={handleStartEdit}
              title="Double-click to edit"
              className={`text-sm select-none cursor-pointer truncate font-medium ${
                task.is_completed ? 'line-through text-stone-400' : 'text-[#1C1917]'
              }`}
            >
              {task.title}
            </span>

            {/* Badges: Tag & Time */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {/* Tag Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tagObj.badgeClass}`}
              >
                {tagObj.id === 'career' && <Briefcase className="w-3 h-3" />}
                {tagObj.id === 'college' && <BookOpen className="w-3 h-3" />}
                {tagObj.id === 'personal' && <Sparkles className="w-3 h-3" />}
                <span>{tagObj.shortLabel}</span>
              </span>

              {/* Repeating indicator */}
              {isRepeating && (
                <span
                  title="Repeating task"
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E5E0D8] text-[#57534E]"
                >
                  <Repeat className="w-3 h-3" />
                  <span>Repeats</span>
                </span>
              )}

              {/* Time Badge (Focus + Break) */}
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#57534E]"
                title={`${formatDuration(task.duration_minutes ?? 30)} focus + ${formatDuration(task.break_minutes ?? 5)} break`}
              >
                <Clock className="w-3 h-3 text-[#224A32]" />
                <span>{formatDuration(task.duration_minutes ?? 30)}</span>
                {(task.break_minutes ?? 5) > 0 && (
                  <span className="text-stone-400 flex items-center gap-0.5">
                    +<Coffee className="w-2.5 h-2.5" />
                    {formatDuration(task.break_minutes ?? 5)}
                  </span>
                )}
                <span className="text-stone-400">(= {formatDuration(totalItemMinutes)})</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right section: Move to Day / Edit / Delete */}
      {/* Delete choice for repeating tasks */}
      {!isEditing && confirmDelete && (
        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 text-[11px] pt-1 sm:pt-0">
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
      )}

      {!isEditing && !confirmDelete && (
        <div className="flex items-center justify-end gap-1.5 pt-1 sm:pt-0 border-t border-[#E5E0D8]/60 sm:border-t-0 shrink-0">
          <select
            value={task.day_of_week}
            onChange={(e) => onMove && onMove(task.id, Number(e.target.value))}
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
          </select>

          <button
            type="button"
            onClick={handleStartEdit}
            aria-label="Edit task"
            className="p-1.5 rounded-full text-stone-400 hover:text-[#1C1917] hover:bg-white transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Delete task"
            className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
