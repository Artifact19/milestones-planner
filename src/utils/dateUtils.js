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

// Curated luxury architectural tags matching the reference design
export const TAG_OPTIONS = [
  {
    id: 'career',
    label: 'Career / Study',
    shortLabel: 'Career',
    color: 'forest',
    badgeClass: 'bg-[#EBF2EC] text-[#244E35] border-[#D2E4D6]'
  },
  {
    id: 'college',
    label: 'College Assignment',
    shortLabel: 'College',
    color: 'basalt',
    badgeClass: 'bg-[#ECEAF0] text-[#3E364E] border-[#DBD6E3]'
  },
  {
    id: 'personal',
    label: 'Personal / Other',
    shortLabel: 'Personal',
    color: 'sand',
    badgeClass: 'bg-[#F4ECE1] text-[#635032] border-[#E8DAC5]'
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
    label: 'College Assignment',
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

