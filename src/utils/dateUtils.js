// Format a Date as 'YYYY-MM-DD' using LOCAL time (avoids timezone bugs)
export function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Parse 'YYYY-MM-DD' into a local Date (at local midnight)
export function parseDateString(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Get the Monday (ISO week start) of the week containing `date`
export function getMonday(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0=Sun ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day // Sunday belongs to the week that STARTED the previous Monday
  d.setDate(d.getDate() + diff)
  return d
}

// Add N days (negative allowed) and return a new Date
export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + n)
  return d
}

export function addWeeks(date, n) {
  return addDays(date, n * 7)
}

// 'Oct 12 – Oct 18, 2026'
export function formatWeekRange(monday) {
  const sunday = addDays(monday, 6)
  const opts = { month: 'short', day: 'numeric' }
  const start = monday.toLocaleDateString('en-US', opts)
  const end = sunday.toLocaleDateString('en-US', opts)
  return `${start} – ${end}, ${sunday.getFullYear()}`
}

// 1=Mon ... 6=Sat, 7=Sun
export const DAY_NAMES = [
  'Weekly Milestones',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isSameWeek(mondayA, mondayB) {
  return toDateString(mondayA) === toDateString(mondayB)
}

// Get day number for today in our system (1=Mon ... 6=Sat, 7=Sun)
export function getTodayDayNumber() {
  const day = new Date().getDay() // 0=Sun, 1=Mon ... 6=Sat
  return day === 0 ? 7 : day
}

// Format minutes into clean human-readable text (e.g. 90 -> '1h 30m', 45 -> '45m', 120 -> '2h')
export function formatDuration(minutes = 0) {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// Auto-suggest appropriate break time based on task focus duration
export function getDefaultBreakMinutes(durationMinutes = 30) {
  if (durationMinutes <= 15) return 0
  if (durationMinutes <= 30) return 5
  if (durationMinutes <= 50) return 10
  if (durationMinutes <= 75) return 15
  if (durationMinutes <= 110) return 20
  if (durationMinutes <= 180) return 30
  if (durationMinutes <= 240) return 40
  if (durationMinutes <= 360) return 50
  return 60
}

// Curated neo-brutalist tags with high-contrast pastel fills and crisp borders
export const TAG_OPTIONS = [
  {
    id: 'career',
    label: 'Career / Study',
    shortLabel: 'Career',
    color: 'forest',
    badgeClass: 'bg-[#DCFCE7] text-[#166534] border-[#1C1917]'
  },
  {
    id: 'college',
    label: 'College/Assignment',
    shortLabel: 'College',
    color: 'basalt',
    badgeClass: 'bg-[#EDE9FE] text-[#5B21B6] border-[#1C1917]'
  },
  {
    id: 'personal',
    label: 'Personal / Other',
    shortLabel: 'Personal',
    color: 'sand',
    badgeClass: 'bg-[#FFE4E6] text-[#9F1239] border-[#1C1917]'
  }
]

export const normalizeCategory = (tag) => {
  if (tag === 'college') return 'college'
  if (tag === 'personal' || tag === 'other') return 'personal'
  return 'career'
}

export const FOCUS_CATEGORY_OPTIONS = [
  {
    id: 'all',
    label: 'All Categories',
    shortLabel: 'All',
    color: '#695431',
    badgeClass: 'bg-[#FAF4EB] text-[#695431] border-[#E8DAC5]'
  },
  {
    id: 'career',
    label: 'Career / Study',
    shortLabel: 'Career',
    color: '#224A32',
    badgeClass: 'bg-[#EBF2EC] text-[#244E35] border-[#D2E4D6]'
  },
  {
    id: 'college',
    label: 'College/Assignment',
    shortLabel: 'College',
    color: '#3E364E',
    badgeClass: 'bg-[#ECEAF0] text-[#3E364E] border-[#DBD6E3]'
  },
  {
    id: 'personal',
    label: 'Personal / Other',
    shortLabel: 'Personal',
    color: '#635032',
    badgeClass: 'bg-[#F4ECE1] text-[#635032] border-[#E8DAC5]'
  }
]

// Curated light highlighter shades harmonized with the #F8F6F0 / #1C1917 neo-brutalist palette
export const HIGHLIGHTER_OPTIONS = [
  { id: 'rose', name: 'Rose Quartz', card: '#FFF1F2', marker: '#FECDD3', accent: '#F43F5E' },
  { id: 'peach', name: 'Peach Apricot', card: '#FFF7ED', marker: '#FED7AA', accent: '#F97316' },
  { id: 'yellow', name: 'Sunburst Yellow', card: '#FEFCE8', marker: '#FEF08A', accent: '#EAB308' },
  { id: 'mint', name: 'Mint Sage', card: '#F0FDF4', marker: '#BBF7D0', accent: '#22C55E' },
  { id: 'sky', name: 'Sky Breeze', card: '#F0F9FF', marker: '#BAE6FD', accent: '#0EA5E9' },
  { id: 'violet', name: 'Lavender Mist', card: '#FAF5FF', marker: '#E9D5FF', accent: '#A855F7' }
]

const HIGHLIGHT_STORAGE_KEY = 'milestones_task_highlights_v1'
const PRIORITY_STORAGE_KEY = 'milestones_task_priorities_v1'
const SHORT_CONNECTOR_WORDS = new Set(['for', 'to', 'of', 'in', 'on', 'and', 'the', 'a', 'with', '&'])

// 6 priority tiers mapped 1-to-1 with cool editorial line-art symbols and pastel colors
export const PRIORITY_OPTIONS = [
  { level: 1, id: 'p1', code: 'P1', label: 'Crown', icon: 'crown', defaultColor: 'rose', card: '#FFF1F2', marker: '#FECDD3', accent: '#F43F5E', badgeBg: '#FECDD3', badgeText: '#9F1239' },
  { level: 2, id: 'p2', code: 'P2', label: 'Bolt', icon: 'bolt', defaultColor: 'peach', card: '#FFF7ED', marker: '#FED7AA', accent: '#F97316', badgeBg: '#FED7AA', badgeText: '#9A3412' },
  { level: 3, id: 'p3', code: 'P3', label: 'Saturn', icon: 'planet', defaultColor: 'yellow', card: '#FEFCE8', marker: '#FEF08A', accent: '#EAB308', badgeBg: '#FEF08A', badgeText: '#854D0E' },
  { level: 4, id: 'p4', code: 'P4', label: 'Wing', icon: 'glider', defaultColor: 'mint', card: '#F0FDF4', marker: '#BBF7D0', accent: '#22C55E', badgeBg: '#BBF7D0', badgeText: '#166534' },
  { level: 5, id: 'p5', code: 'P5', label: 'Prism', icon: 'hourglass', defaultColor: 'sky', card: '#F0F9FF', marker: '#BAE6FD', accent: '#0EA5E9', badgeBg: '#BAE6FD', badgeText: '#0369A1' },
  { level: 6, id: 'p6', code: 'P6', label: 'Moon', icon: 'crescent', defaultColor: 'violet', card: '#FAF5FF', marker: '#E9D5FF', accent: '#A855F7', badgeBg: '#E9D5FF', badgeText: '#5B21B6' }
]

// Extract a short scannable prefix from long task titles for the highlighter pill
export function splitTaskTitleForHighlight(title = '') {
  const trimmed = String(title || '').trim()
  if (!trimmed) return { prefix: '', rest: '' }

  // Handle leading numbered prefixes like "6 - DSA problems old (python & c++)..."
  const numPrefixMatch = trimmed.match(/^(\d+\s*[-–]\s*\S+(?:\s+\S+){0,1})\s+(.+)$/)
  if (numPrefixMatch) {
    return { prefix: numPrefixMatch[1].trim(), rest: numPrefixMatch[2].trim() }
  }

  // Split at delimiters (: — – or spaced -)
  const sepMatch = trimmed.match(/^(.{2,34}?)\s*(?:[:—–]|\s-\s)\s*(.+)$/)
  if (sepMatch) {
    return { prefix: sepMatch[1].trim(), rest: sepMatch[2].trim() }
  }

  const words = trimmed.split(/\s+/)
  if (words.length <= 3) {
    return { prefix: trimmed, rest: '' }
  }

  const takeCount = SHORT_CONNECTOR_WORDS.has(words[1].toLowerCase()) ? 3 : 2
  return {
    prefix: words.slice(0, takeCount).join(' '),
    rest: words.slice(takeCount).join(' ')
  }
}

function readTaskMap(storageKey) {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeTaskMap(storageKey, map, shouldDispatch = true) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map))
    if (shouldDispatch) {
      window.dispatchEvent(new CustomEvent('milestones-highlight-change'))
    }
  } catch {
    // ignore storage quota errors
  }
}

function lookupTaskMapValue(map, task) {
  const normTitle = String(task?.title || '').trim().toLowerCase()
  return (
    (task?.id && map[`id:${task.id}`]) ||
    (task?.series_id && map[`series:${task.series_id}`]) ||
    (normTitle && map[`title:${normTitle}`]) ||
    null
  )
}

function saveTaskMapValue(storageKey, task, value, syncSeries = true, shouldDispatch = true) {
  const map = readTaskMap(storageKey)
  const normTitle = String(task?.title || '').trim().toLowerCase()

  if (syncSeries) {
    if (task?.series_id) {
      map[`series:${task.series_id}`] = value
      // Remove any stale per-task override on this card so it stays synced with the series
      if (task?.id) delete map[`id:${task.id}`]
    } else if (task?.id) {
      map[`id:${task.id}`] = value
    }
    if (normTitle) {
      map[`title:${normTitle}`] = value
    }
  } else if (task?.id) {
    map[`id:${task.id}`] = value
  }

  writeTaskMap(storageKey, map, shouldDispatch)
}

function findHighlighterById(colorId) {
  return HIGHLIGHTER_OPTIONS.find((h) => h.id === colorId) || null
}

export function getStoredTaskPriorityLevel(task) {
  const map = readTaskMap(PRIORITY_STORAGE_KEY)
  const raw = lookupTaskMapValue(map, task)
  if (raw === null || raw === undefined || raw === '') return null
  const num = Number(raw)
  return Number.isInteger(num) && num >= 1 ? num : null
}

export function getTaskPriority(task, fallbackIndex = 0) {
  const stored = getStoredTaskPriorityLevel(task)
  const effectiveRank = stored !== null ? stored : Math.max(0, Number(fallbackIndex) || 0) + 1
  return PRIORITY_OPTIONS[(effectiveRank - 1) % PRIORITY_OPTIONS.length]
}

export function getTaskHighlighter(task, fallbackIndex = 0) {
  const prio = getTaskPriority(task, fallbackIndex)
  return findHighlighterById(prio.defaultColor) || HIGHLIGHTER_OPTIONS[0]
}

export function setTaskHighlighter(task, colorId, syncSeries = true) {
  if (!findHighlighterById(colorId)) return
  saveTaskMapValue(HIGHLIGHT_STORAGE_KEY, task, colorId, syncSeries, true)
}

export function setTaskPriority(task, level, syncSeries = true, syncColor = true) {
  const num = Number(level)
  if (!Number.isInteger(num) || num < 1) return
  const tier = PRIORITY_OPTIONS[(num - 1) % PRIORITY_OPTIONS.length]

  // When also syncing color, defer event dispatch until highlighter write so subscribers re-read both atomically
  saveTaskMapValue(PRIORITY_STORAGE_KEY, task, num, syncSeries, !syncColor)
  if (syncColor) {
    setTaskHighlighter(task, tier.defaultColor, syncSeries)
  }
}

export function syncTaskPrioritiesForOrder(incompleteTasks = []) {
  if (!Array.isArray(incompleteTasks) || incompleteTasks.length === 0) return
  const prioMap = readTaskMap(PRIORITY_STORAGE_KEY)
  const hlMap = readTaskMap(HIGHLIGHT_STORAGE_KEY)

  incompleteTasks.forEach((task, idx) => {
    if (!task?.id) return
    const tier = PRIORITY_OPTIONS[idx % PRIORITY_OPTIONS.length]
    prioMap[`id:${task.id}`] = idx + 1
    hlMap[`id:${task.id}`] = tier.defaultColor
  })

  writeTaskMap(PRIORITY_STORAGE_KEY, prioMap, false)
  writeTaskMap(HIGHLIGHT_STORAGE_KEY, hlMap, true)
}

/** Stable-sort incomplete tasks by explicit priority rank while preserving fallback order for unprioritized items. */
export function sortIncompleteByPriority(incompleteList = []) {
  const indexMap = new Map(incompleteList.map((t, idx) => [t.id, idx]))
  return [...incompleteList].sort((a, b) => {
    const pA = getStoredTaskPriorityLevel(a)
    const pB = getStoredTaskPriorityLevel(b)
    const rankA = pA !== null ? pA : (indexMap.get(a.id) ?? 0) + 1
    const rankB = pB !== null ? pB : (indexMap.get(b.id) ?? 0) + 1
    if (rankA !== rankB) return rankA - rankB
    if ((pA !== null) !== (pB !== null)) return pA !== null ? -1 : 1
    return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)
  })
}

export function getPriorityStorageSnapshot() {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(PRIORITY_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function subscribeTaskHighlighters(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('milestones-highlight-change', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('milestones-highlight-change', callback)
    window.removeEventListener('storage', callback)
  }
}

