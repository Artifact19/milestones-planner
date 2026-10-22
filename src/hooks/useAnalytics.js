import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { parseDateString, addDays, normalizeCategory } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function useAnalytics() {
  const { user } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMilestones = useCallback(async () => {
    if (!user) {
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
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: true })

      if (fetchErr) throw fetchErr
      setMilestones(data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  // Process data into monthly and yearly buckets
  const analytics = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() // 0-indexed

    // Monthly data for the current year (Jan through Dec)
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
        focusByCategory: {
          career: 0,
          college: 0,
          personal: 0
        },
        percent: 0,
        isCurrent: m === currentMonth
      }
    }

    // Yearly buckets
    const yearsMap = {}

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

      // Add to current year months
      if (y === currentYear && monthsMap[mon]) {
        monthsMap[mon].total += 1
        if (isComp) {
          monthsMap[mon].completed += 1
          monthsMap[mon].focusMinutes += dur
          monthsMap[mon].focusByCategory[cat] = (monthsMap[mon].focusByCategory[cat] || 0) + dur
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

    // Compute percentages for monthly
    const monthlyList = Object.values(monthsMap).map((item) => ({
      ...item,
      percent: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
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

    const totalFocusByCategory = {
      career: 0,
      college: 0,
      personal: 0
    }

    milestones.forEach((m) => {
      if (m.is_completed) {
        const cat = normalizeCategory(m.tag)
        const dur = m.duration_minutes ?? 30
        totalFocusByCategory[cat] = (totalFocusByCategory[cat] || 0) + dur
      }
    })

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
      totalFocusByCategory,
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
