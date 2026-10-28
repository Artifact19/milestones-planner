import { useState, useRef, useEffect } from 'react'
import {
  Plus,
  Clock,
  Coffee,
  Tag,
  Briefcase,
  BookOpen,
  Sparkles,
  ChevronDown,
  Repeat
} from 'lucide-react'
import { formatDuration, getDefaultBreakMinutes, TAG_OPTIONS } from '../utils/dateUtils'

export default function AddTaskInput({
  selectedDay = null,
  onAdd,
  onAddBatch,
  placeholder = 'Add a task… (press Enter)'
}) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [selectedTag, setSelectedTag] = useState('career')
  const [showOptions, setShowOptions] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedDays, setSelectedDays] = useState(() =>
    selectedDay === 0 ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6]
  )
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // When viewing Weekly Master (day 0), ensure day 0 is selected for recurring additions
  useEffect(() => {
    if (selectedDay === 0) {
      setSelectedDays((prev) => (prev.includes(0) ? prev : [0, ...prev]))
    }
  }, [selectedDay])

  // Auto-close options popup when clicking outside in empty space or pressing Escape
  useEffect(() => {
    if (!showOptions) return

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowOptions(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showOptions])

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration)
    setBreakMinutes(getDefaultBreakMinutes(newDuration))
  }

  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayNum))
      }
    } else {
      setSelectedDays([...selectedDays, dayNum].sort())
    }
  }

  const handleApplyPreset = (presetDays) => {
    if (selectedDay === 0 && !presetDays.includes(0)) {
      setSelectedDays([0, ...presetDays])
    } else {
      setSelectedDays(presetDays)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    const finalDuration = Math.max(1, Math.min(1440, Number(duration) || 30))
    const finalBreak = Math.max(0, Math.min(240, Number(breakMinutes) || 0))

    if (isRecurring && onAddBatch && selectedDays.length > 0) {
      onAddBatch(selectedDays, trimmed, finalDuration, finalBreak, selectedTag)
    } else {
      onAdd(trimmed, finalDuration, finalBreak, selectedTag)
    }

    setTitle('')
    // Collapse the options panel and turn off repeat mode after each add
    setShowOptions(false)
    setIsRecurring(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const totalTime = duration + breakMinutes

  const dayButtons = [
    { num: 0, label: 'Wk', name: 'Weekly Master' },
    { num: 1, label: 'M', name: 'Mon' },
    { num: 2, label: 'T', name: 'Tue' },
    { num: 3, label: 'W', name: 'Wed' },
    { num: 4, label: 'T', name: 'Thu' },
    { num: 5, label: 'F', name: 'Fri' },
    { num: 6, label: 'S', name: 'Sat' },
    { num: 7, label: 'S', name: 'Sun' }
  ]

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className="bg-white border-2 border-[#1C1917] focus-within:border-[#1C1917] rounded-3xl p-3.5 shadow-[4px_4px_0px_#1C1917] transition-all"
    >
      {/* Title Input Row */}
      <div className="flex items-center gap-2">
        <div className="text-[#1C1917] shrink-0 pl-1.5">
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isRecurring
              ? `Repeat on ${selectedDays.length} days…`
              : placeholder
          }
          maxLength={200}
          className="flex-1 min-w-0 bg-transparent text-sm font-bold text-[#1C1917] placeholder-stone-400 focus:outline-none font-sans"
        />

        {/* Quick Options Button */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          aria-label="Toggle time, tag, and repeat options"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#1C1917] transition-all cursor-pointer shrink-0 ${
            showOptions || isRecurring
              ? 'bg-[#FEF08A] text-[#1C1917] shadow-[2px_2px_0px_#1C1917]'
              : 'bg-white border-[#1C1917] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] hover:bg-[#FAF8F5]'
          }`}
        >
          {isRecurring && <Repeat className="w-3.5 h-3.5" />}
          <Clock className="w-3.5 h-3.5 stroke-[2]" />
          <span className="font-mono">{formatDuration(duration)}</span>
          {breakMinutes > 0 && <span className="opacity-70 hidden sm:inline">+{breakMinutes}m</span>}
          <ChevronDown className={`w-3 h-3 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </button>

        {/* Neo-Brutalist Submit Button */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] disabled:opacity-30 disabled:cursor-not-allowed text-[#1C1917] font-black rounded-xl text-xs border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          {isRecurring ? `${selectedDays.length} Days` : 'Add'}
        </button>
      </div>

      {/* Expandable Options */}
      {showOptions && (
        <div className="mt-3.5 pt-3.5 border-t-2 border-[#1C1917]/15 space-y-3.5 animate-in fade-in duration-150">
          {/* Recurring Master Routine Mode Toggle */}
          <div className="bg-[#FAF8F5] border-2 border-[#1C1917] rounded-2xl p-3 space-y-2.5 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#1C1917]" />
                <span className="text-xs font-black text-[#1C1917]">
                  Repeat across multiple days
                </span>
                <span className="text-[10px] font-bold text-[#1C1917] bg-[#FEF08A] px-2 py-0.5 rounded-md border border-[#1C1917]">
                  e.g. Study 2h Mon–Sat
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-[#1C1917] transition-colors duration-200 ease-in-out focus:outline-none ${
                  isRecurring ? 'bg-[#FEF08A]' : 'bg-[#E7E5E4]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-[#1C1917] border border-[#1C1917] shadow ring-0 transition duration-200 ease-in-out ${
                    isRecurring ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Presets and Day Toggles when recurring is enabled */}
            {isRecurring && (
              <div className="pt-2.5 border-t border-[#1C1917]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#1C1917] font-bold text-[11px] mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset([1, 2, 3, 4, 5, 6])}
                    className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] font-bold text-[11px] shadow-[1px_1px_0px_#1C1917] cursor-pointer"
                  >
                    Mon to Sat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset([1, 2, 3, 4, 5])}
                    className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] font-bold text-[11px] shadow-[1px_1px_0px_#1C1917] cursor-pointer"
                  >
                    Mon to Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset([1, 2, 3, 4, 5, 6, 7])}
                    className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] font-bold text-[11px] shadow-[1px_1px_0px_#1C1917] cursor-pointer"
                  >
                    All 7 Days
                  </button>
                  {selectedDay === 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDays([0])}
                      className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] font-bold text-[11px] shadow-[1px_1px_0px_#1C1917] cursor-pointer"
                    >
                      Master Only
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {dayButtons.map((d) => {
                    const isChecked = selectedDays.includes(d.num)
                    return (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleDay(d.num)}
                        title={d.name}
                        className={`w-6 h-6 text-[10px] font-black rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#FEF08A] border-[#1C1917] text-[#1C1917] shadow-[1px_1px_0px_#1C1917]'
                            : 'bg-white border-[#1C1917]/40 text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tag Selector */}
          <div>
            <div className="text-[11px] font-black text-[#1C1917] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#1C1917]" />
              <span>Category / Tag</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTag === tag.id
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTag(tag.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl border-2 font-bold transition-all cursor-pointer ${
                      isSelected
                        ? tag.badgeClass + ' border-[#1C1917] shadow-[2px_2px_0px_#1C1917]'
                        : 'bg-white border-[#1C1917]/40 text-[#57534E] hover:border-[#1C1917]'
                    }`}
                  >
                    {tag.id === 'career' && <Briefcase className="w-3 h-3" />}
                    {tag.id === 'college' && <BookOpen className="w-3 h-3" />}
                    {tag.id === 'personal' && <Sparkles className="w-3 h-3" />}
                    <span>{tag.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duration & Break Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Focus Duration */}
            <div>
              <div className="text-[11px] font-black text-[#1C1917] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#1C1917]" />
                <span>Focus Time</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {[15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 480].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationChange(mins)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                      duration === mins
                        ? 'bg-[#FEF08A] border-[#1C1917] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                        : 'bg-white border-[#1C1917]/40 text-[#57534E] hover:border-[#1C1917]'
                    }`}
                  >
                    {formatDuration(mins)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-[#E5E0D8]/60">
                <span className="text-[11px] font-medium text-[#78716C]">Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  value={duration}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setDuration('')
                    } else {
                      const parsed = parseInt(raw, 10)
                      setDuration(isNaN(parsed) ? '' : Math.max(0, Math.min(1440, parsed)))
                      if (!isNaN(parsed) && parsed > 0) {
                        setBreakMinutes(getDefaultBreakMinutes(parsed))
                      }
                    }
                  }}
                  onBlur={() => {
                    if (duration === '' || Number(duration) < 1) {
                      setDuration(30)
                      setBreakMinutes(5)
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-16 px-2 py-0.5 text-xs font-mono bg-white border border-[#E5E0D8] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
                />
                <span className="text-[11px] text-[#78716C] font-mono">
                  min ({formatDuration(Number(duration) || 0)})
                </span>
              </div>
            </div>

            {/* Break Time */}
            <div>
              <div className="text-[11px] font-black text-[#1C1917] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Coffee className="w-3 h-3 text-[#1C1917]" />
                <span>Rest Break</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {[0, 5, 10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBreakMinutes(mins)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                      breakMinutes === mins
                        ? 'bg-[#FEF08A] border-[#1C1917] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                        : 'bg-white border-[#1C1917]/40 text-[#57534E] hover:border-[#1C1917]'
                    }`}
                  >
                    {mins === 0 ? 'None' : `${mins}m`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-[#E5E0D8]/60">
                <span className="text-[11px] font-medium text-[#78716C]">Custom:</span>
                <input
                  type="number"
                  min="0"
                  max="240"
                  step="1"
                  value={breakMinutes}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setBreakMinutes('')
                    } else {
                      const parsed = parseInt(raw, 10)
                      setBreakMinutes(isNaN(parsed) ? '' : Math.max(0, Math.min(240, parsed)))
                    }
                  }}
                  onBlur={() => {
                    if (breakMinutes === '') {
                      setBreakMinutes(0)
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-16 px-2 py-0.5 text-xs font-mono bg-white border border-[#E5E0D8] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
                />
                <span className="text-[11px] text-[#78716C] font-mono">
                  min ({Number(breakMinutes) === 0 ? 'None' : `${breakMinutes}m`})
                </span>
              </div>
            </div>
          </div>

          {/* Budgeted Summary Preview */}
          <div className="text-xs text-[#78716C] bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl px-3 py-2 flex items-center justify-between">
            <span>
              Per task: <span className="text-[#1C1917] font-semibold">{formatDuration(duration)} focus</span>
              {breakMinutes > 0 && <span> + <span className="text-[#695431] font-semibold">{breakMinutes}m break</span></span>}
            </span>
            <span className="font-mono text-[#1C1917] font-bold">
              = {formatDuration(totalTime)} total {isRecurring ? `(x ${selectedDays.length} days)` : ''}
            </span>
          </div>
        </div>
      )}
    </form>
  )
}
