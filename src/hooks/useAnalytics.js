import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { parseDateString, addDays, normalizeCategory, getMonday, toDateString } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function recordTaskIntoBucket(bucketMap, m) {
  const rawTitle = (m.title || 'Untitled Task').trim()
  const cat = normalizeCategory(m.tag)
  const key = `${cat}::${rawTitle.toLowerCase()}`
  const dur = m.duration_minutes ?? 30
  const brk = m.break_minutes ?? 5
  const isComp = Boolean(m.is_completed)
  const isCalendarDay = Number(m.day_of_week) >= 1 && Number(m.day_of_week) <= 7

  if (!bucketMap[key]) {
    bucketMap[key] = {
      key,
      title: rawTitle,
      category: cat,
      perSessionFocus: dur,
      perSessionBreak: brk,
      calendarTotalCount: 0,
      calendarCompletedCount: 0,
      calendarPlannedFocusMinutes: 0,
      calendarCompletedFocusMinutes: 0,
      calendarPlannedBreakMinutes: 0,
      calendarCompletedBreakMinutes: 0,
      masterTotalCount: 0,
      masterCompletedCount: 0,
      masterPlannedFocusMinutes: 0,
      masterCompletedFocusMinutes: 0
    }
  }

  const entry = bucketMap[key]
  if (isCalendarDay) {
    entry.calendarTotalCount += 1
    entry.calendarPlannedFocusMinutes += dur
    entry.calendarPlannedBreakMinutes += brk
    if (isComp) {
      entry.calendarCompletedCount += 1
      entry.calendarCompletedFocusMinutes += dur
      entry.calendarCompletedBreakMinutes += brk
    }
  } else {
    entry.masterTotalCount += 1
    entry.masterPlannedFocusMinutes += dur
    if (isComp) {
      entry.masterCompletedCount += 1
      entry.masterCompletedFocusMinutes += dur
    }
  }
}

function finalizeTaskBreakdown(bucketMap) {
  return Object.values(bucketMap)
    .map((entry) => {
      const useCalendar = entry.calendarTotalCount > 0
      const totalCount = useCalendar ? entry.calendarTotalCount : entry.masterTotalCount
      const completedCount = useCalendar ? entry.calendarCompletedCount : entry.masterCompletedCount
      const plannedFocusMinutes = useCalendar
        ? entry.calendarPlannedFocusMinutes
        : entry.masterPlannedFocusMinutes
      const completedFocusMinutes = useCalendar
        ? entry.calendarCompletedFocusMinutes
        : entry.masterCompletedFocusMinutes
      const plannedBreakMinutes = useCalendar ? entry.calendarPlannedBreakMinutes : 0
      const completedBreakMinutes = useCalendar ? entry.calendarCompletedBreakMinutes : 0

      return {
        key: entry.key,
        title: entry.title,
        category: entry.category,
        perSessionFocus: entry.perSessionFocus,
        perSessionBreak: entry.perSessionBreak,
        totalCount,
        completedCount,
        plannedFocusMinutes,
        completedFocusMinutes,
        plannedBreakMinutes,
        completedBreakMinutes,
        plannedTotalMinutes: plannedFocusMinutes + plannedBreakMinutes,
        completedTotalMinutes: completedFocusMinutes + completedBreakMinutes
      }
    })
    .sort((a, b) => {
      if (b.completedFocusMinutes !== a.completedFocusMinutes) {
        return b.completedFocusMinutes - a.completedFocusMinutes
      }
      return b.plannedFocusMinutes - a.plannedFocusMinutes
    })
}

// Helper to partition any month into its weekly calendar segments
function buildWeeksForMonth(year, monthIndex) {
  const weeks = []
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const monthShort = MONTH_NAMES[monthIndex]
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex
  const todayDate = today.getDate()

  let currentStartDay = 1
  let weekNum = 1

  while (currentStartDay <= daysInMonth) {
    const startDate = new Date(year, monthIndex, currentStartDay)
    const dayOfWeek = startDate.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    // Sunday ends the week in our ISO-based system
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const endDay = Math.min(daysInMonth, currentStartDay + daysUntilSunday)

    const isCurrentWeek =
      isCurrentMonth && todayDate >= currentStartDay && todayDate <= endDay

    const mondayDate = getMonday(startDate)
    const mondayStr = toDateString(mondayDate)

    const dateRange =
      currentStartDay === endDay
        ? `${monthShort} ${currentStartDay}`
        : `${monthShort} ${currentStartDay} – ${monthShort} ${endDay}`

    const dateRangeShort =
      currentStartDay === endDay
        ? `${monthShort} ${currentStartDay}`
        : `${monthShort} ${currentStartDay}–${endDay}`

    weeks.push({
      weekNumber: weekNum,
      weekLabel: `Week ${weekNum}`,
      dateRange,
      dateRangeShort,
      startDay: currentStartDay,
      endDay,
      mondayDate,
      mondayStr,
      isCurrentWeek,
      total: 0,
      completed: 0,
      focusMinutes: 0,
      plannedFocusMinutes: 0,
      focusByCategory: {
        career: 0,
        college: 0,
        personal: 0
      },
      plannedFocusByCategory: {
        career: 0,
        college: 0,
        personal: 0
      },
      _taskMap: {},
      taskBreakdown: [],
      percent: 0
    })

    currentStartDay = endDay + 1
    weekNum++
  }

  return weeks
}

export function useAnalytics() {
  const { user } = useAuth()
  const userId = user?.id
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMilestones = useCallback(async () => {
    if (!userId) {
      setMilestones([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchErr } = await supabase
        .from('milestones')
        .select('id, week_start_date, day_of_week, title, is_completed, duration_minutes, break_minutes, tag, created_at')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: true })

      if (fetchErr) throw fetchErr
      setMilestones(data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  // Process data into monthly and yearly buckets
  const analytics = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() // 0-indexed

    // Monthly data for the current year (Jan through Dec) with weekly breakdown
    const monthsMap = {}
    for (let m = 0; m < 12; m++) {
      monthsMap[m] = {
        monthIndex: m,
        monthShort: MONTH_NAMES[m],
        monthFull: MONTH_FULL_NAMES[m],
        year: currentYear,
        total: 0,
        completed: 0,
        focusMinutes: 0,
        plannedFocusMinutes: 0,
        focusByCategory: {
          career: 0,
          college: 0,
          personal: 0
        },
        plannedFocusByCategory: {
          career: 0,
          college: 0,
          personal: 0
        },
        _taskMap: {},
        taskBreakdown: [],
        percent: 0,
        isCurrent: m === currentMonth,
        weeksList: buildWeeksForMonth(currentYear, m)
      }
    }

    // Yearly buckets
    const yearsMap = {}
    const allTimeTaskMap = {}

    milestones.forEach((m) => {
      // Determine the calendar date of this task
      let taskDate = parseDateString(m.week_start_date)
      if (m.day_of_week >= 1 && m.day_of_week <= 7) {
        taskDate = addDays(taskDate, m.day_of_week - 1)
      }

      const y = taskDate.getFullYear()
      const mon = taskDate.getMonth()
      const isComp = Boolean(m.is_completed)
      const dur = m.duration_minutes ?? 30
      const cat = normalizeCategory(m.tag)
      const isCalendarDay = Number(m.day_of_week) >= 1 && Number(m.day_of_week) <= 7

      recordTaskIntoBucket(allTimeTaskMap, m)

      // Add to current year months
      if (y === currentYear && monthsMap[mon]) {
        const mObj = monthsMap[mon]
        mObj.total += 1
        if (isCalendarDay) {
          mObj.plannedFocusMinutes += dur
          mObj.plannedFocusByCategory[cat] = (mObj.plannedFocusByCategory[cat] || 0) + dur
        }
        if (isComp) {
          mObj.completed += 1
          mObj.focusMinutes += dur
          mObj.focusByCategory[cat] = (mObj.focusByCategory[cat] || 0) + dur
        }
        recordTaskIntoBucket(mObj._taskMap, m)

        // Add to corresponding week inside this month
        const dayOfMonth = taskDate.getDate()
        const targetWeek = mObj.weeksList.find(
          (w) => dayOfMonth >= w.startDay && dayOfMonth <= w.endDay
        )
        if (targetWeek) {
          targetWeek.total += 1
          if (isCalendarDay) {
            targetWeek.plannedFocusMinutes += dur
            targetWeek.plannedFocusByCategory[cat] =
              (targetWeek.plannedFocusByCategory[cat] || 0) + dur
          }
          if (isComp) {
            targetWeek.completed += 1
            targetWeek.focusMinutes += dur
            targetWeek.focusByCategory[cat] = (targetWeek.focusByCategory[cat] || 0) + dur
          }
          recordTaskIntoBucket(targetWeek._taskMap, m)
        }
      }

      // Add to years map
      if (!yearsMap[y]) {
        yearsMap[y] = {
          year: y,
          total: 0,
          completed: 0,
          focusMinutes: 0,
          focusByCategory: {
            career: 0,
            college: 0,
            personal: 0
          },
          quarters: {
            Q1: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } },
            Q2: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } },
            Q3: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } },
            Q4: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } }
          }
        }
      }

      yearsMap[y].total += 1
      if (isComp) {
        yearsMap[y].completed += 1
        yearsMap[y].focusMinutes += dur
        yearsMap[y].focusByCategory[cat] = (yearsMap[y].focusByCategory[cat] || 0) + dur
      }

      // Assign to quarter
      const qNum = Math.floor(mon / 3) + 1
      const qKey = 'Q' + qNum
      yearsMap[y].quarters[qKey].total += 1
      if (isComp) {
        yearsMap[y].quarters[qKey].completed += 1
        yearsMap[y].quarters[qKey].focusMinutes += dur
        yearsMap[y].quarters[qKey].focusByCategory[cat] = (yearsMap[y].quarters[qKey].focusByCategory[cat] || 0) + dur
      }
    })

    // Compute percentages and finalize task breakdowns for monthly and its weeks
    const monthlyList = Object.values(monthsMap).map((item) => ({
      ...item,
      percent: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
      taskBreakdown: finalizeTaskBreakdown(item._taskMap),
      weeksList: item.weeksList.map((w) => ({
        ...w,
        percent: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0,
        taskBreakdown: finalizeTaskBreakdown(w._taskMap)
      }))
    }))

    // Compute percentages for yearly
    if (!yearsMap[currentYear]) {
      yearsMap[currentYear] = {
        year: currentYear,
        total: 0,
        completed: 0,
        focusMinutes: 0,
        focusByCategory: {
          career: 0,
          college: 0,
          personal: 0
        },
        quarters: {
          Q1: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } },
          Q2: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } },
          Q3: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } },
          Q4: { total: 0, completed: 0, focusMinutes: 0, focusByCategory: { career: 0, college: 0, personal: 0 } }
        }
      }
    }

    const yearlyList = Object.values(yearsMap)
      .sort((a, b) => a.year - b.year)
      .map((item) => {
        const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
        const qList = Object.entries(item.quarters).map(([qKey, qData]) => ({
          quarter: qKey,
          total: qData.total,
          completed: qData.completed,
          percent: qData.total > 0 ? Math.round((qData.completed / qData.total) * 100) : 0,
          focusMinutes: qData.focusMinutes,
          focusByCategory: qData.focusByCategory
        }))

        return {
          ...item,
          percent,
          quarterList: qList
        }
      })

    // All-time summary numbers
    const totalAll = milestones.length
    const completedAll = milestones.filter((m) => m.is_completed).length
    const overallPercent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0
    const totalFocusMinutes = milestones
      .filter((m) => m.is_completed)
      .reduce((acc, m) => acc + (m.duration_minutes ?? 30), 0)
    const totalPlannedFocusMinutes = milestones
      .filter((m) => Number(m.day_of_week) >= 1 && Number(m.day_of_week) <= 7)
      .reduce((acc, m) => acc + (m.duration_minutes ?? 30), 0)

    const totalFocusByCategory = {
      career: 0,
      college: 0,
      personal: 0
    }
    const totalPlannedFocusByCategory = {
      career: 0,
      college: 0,
      personal: 0
    }

    milestones.forEach((m) => {
      const cat = normalizeCategory(m.tag)
      const dur = m.duration_minutes ?? 30
      if (Number(m.day_of_week) >= 1 && Number(m.day_of_week) <= 7) {
        totalPlannedFocusByCategory[cat] = (totalPlannedFocusByCategory[cat] || 0) + dur
      }
      if (m.is_completed) {
        totalFocusByCategory[cat] = (totalFocusByCategory[cat] || 0) + dur
      }
    })

    const allTimeTaskBreakdown = finalizeTaskBreakdown(allTimeTaskMap)

    // Best month calculation
    const activeMonths = monthlyList.filter((m) => m.total > 0)
    let bestMonth = null
    if (activeMonths.length > 0) {
      bestMonth = activeMonths.reduce((prev, curr) => (curr.percent > prev.percent ? curr : prev))
    }

    return {
      monthlyList,
      yearlyList,
      totalAll,
      completedAll,
      overallPercent,
      totalFocusMinutes,
      totalPlannedFocusMinutes,
      totalFocusByCategory,
      totalPlannedFocusByCategory,
      allTimeTaskBreakdown,
      bestMonth,
      currentYear
    }
  }, [milestones])

  return {
    ...analytics,
    milestones,
    loading,
    error,
    refreshAnalytics: fetchMilestones
  }
}
