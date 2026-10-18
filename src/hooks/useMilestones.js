import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toDateString } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'

// Generates a UUID (used to link repeating tasks together as one "series")
function newUuid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function useMilestones(weekStart) {
  const { user } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const weekStartDateString = useMemo(() => toDateString(weekStart), [weekStart])

  // Fetch milestones whenever weekStart or user changes
  useEffect(() => {
    let ignore = false

    async function fetchMilestones() {
      if (!user) return
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('milestones')
          .select('*')
          .eq('week_start_date', weekStartDateString)
          .order('created_at', { ascending: true })

        if (ignore) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setMilestones(data || [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to fetch milestones')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchMilestones()

    return () => {
      ignore = true
    }
  }, [weekStartDateString, user])

  // Add a single milestone
  const addMilestone = useCallback(
    async (dayOfWeek, rawTitle, durationMinutes = 30, breakMinutes = 5, tag = 'career') => {
      const title = rawTitle.trim()
      if (!title || !user) return

      const tempId = 'temp-' + (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
      const optimisticItem = {
        id: tempId,
        user_id: user.id,
        week_start_date: weekStartDateString,
        day_of_week: dayOfWeek,
        title,
        duration_minutes: durationMinutes,
        break_minutes: breakMinutes,
        tag: tag || 'career',
        is_completed: false,
        created_at: new Date().toISOString()
      }

      setMilestones((prev) => [...prev, optimisticItem])
      setError(null)

      try {
        const { data, error: insertError } = await supabase
          .from('milestones')
          .insert({
            user_id: user.id,
            week_start_date: weekStartDateString,
            day_of_week: dayOfWeek,
            title,
            duration_minutes: durationMinutes,
            break_minutes: breakMinutes,
            tag: tag || 'career',
            is_completed: false
          })
          .select()
          .single()

        if (insertError) {
          setMilestones((prev) => prev.filter((m) => m.id !== tempId))
          setError(`Could not add task: ${insertError.message}`)
        } else if (data) {
          setMilestones((prev) => prev.map((m) => (m.id === tempId ? data : m)))
        }
      } catch (err) {
        setMilestones((prev) => prev.filter((m) => m.id !== tempId))
        setError(`Could not add task: ${err.message || 'Network error'}`)
      }
    },
    [weekStartDateString, user]
  )

  // Batch add routine tasks across multiple days (e.g. Mon to Sat) in one click
  const addBatchMilestones = useCallback(
    async (daysArray, rawTitle, durationMinutes = 30, breakMinutes = 5, tag = 'career') => {
      const title = rawTitle.trim()
      if (!title || !user || !daysArray.length) return

      // All copies of this repeating task share one series id
      const seriesId = newUuid()

      const tempItems = daysArray.map((day) => ({
        id: 'temp-' + newUuid(),
        user_id: user.id,
        week_start_date: weekStartDateString,
        day_of_week: day,
        title,
        duration_minutes: durationMinutes,
        break_minutes: breakMinutes,
        tag: tag || 'career',
        series_id: seriesId,
        is_completed: false,
        created_at: new Date().toISOString()
      }))

      setMilestones((prev) => [...prev, ...tempItems])
      setError(null)

      const payload = daysArray.map((day) => ({
        series_id: seriesId,
        user_id: user.id,
        week_start_date: weekStartDateString,
        day_of_week: day,
        title,
        duration_minutes: durationMinutes,
        break_minutes: breakMinutes,
        tag: tag || 'career',
        is_completed: false
      }))

      try {
        const { data, error: insertError } = await supabase
          .from('milestones')
          .insert(payload)
          .select()

        if (insertError) {
          const tempIds = new Set(tempItems.map((t) => t.id))
          setMilestones((prev) => prev.filter((m) => !tempIds.has(m.id)))
          setError(`Could not add recurring tasks: ${insertError.message}`)
        } else if (data) {
          const tempIds = new Set(tempItems.map((t) => t.id))
          setMilestones((prev) => {
            const preserved = prev.filter((m) => !tempIds.has(m.id))
            return [...preserved, ...data]
          })
        }
      } catch (err) {
        const tempIds = new Set(tempItems.map((t) => t.id))
        setMilestones((prev) => prev.filter((m) => !tempIds.has(m.id)))
        setError(`Could not add recurring tasks: ${err.message || 'Network error'}`)
      }
    },
    [weekStartDateString, user]
  )

  // Toggle milestone with optimistic update
  const toggleMilestone = useCallback(async (id) => {
    if (String(id).startsWith('temp-')) return

    let previousItem = null

    setMilestones((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          previousItem = item
          return { ...item, is_completed: !item.is_completed }
        }
        return item
      })
    })

    if (!previousItem) return
    const newStatus = !previousItem.is_completed

    try {
      const { error: updateError } = await supabase
        .from('milestones')
        .update({ is_completed: newStatus })
        .eq('id', id)

      if (updateError) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === id ? previousItem : m))
        )
        setError(`Could not update task: ${updateError.message}`)
      }
    } catch (err) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? previousItem : m))
      )
      setError(`Could not update task: ${err.message || 'Network error'}`)
    }
  }, [])

  // Update milestone fields
  const updateMilestone = useCallback(async (id, updates) => {
    if (String(id).startsWith('temp-')) return

    let previousItem = null

    setMilestones((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          previousItem = item
          return { ...item, ...updates }
        }
        return item
      })
    })

    try {
      const { error: updateError } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === id ? previousItem : m))
        )
        setError(`Could not save edit: ${updateError.message}`)
      }
    } catch (err) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? previousItem : m))
      )
      setError(`Could not save edit: ${err.message || 'Network error'}`)
    }
  }, [])

  // Move milestone to a different day
  const moveMilestone = useCallback(async (id, newDayOfWeek) => {
    await updateMilestone(id, { day_of_week: newDayOfWeek })
  }, [updateMilestone])

  // Delete milestone with optimistic update
  const deleteMilestone = useCallback(
    async (id) => {
      if (!id || !user) return
      if (String(id).startsWith('temp-')) {
        setMilestones((prev) => prev.filter((m) => m.id !== id))
        return
      }

      // Capture target item from current state for rollback
      const itemToDelete = milestones.find((m) => m.id === id)
      setMilestones((prev) => prev.filter((m) => m.id !== id))
      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from('milestones')
          .delete()
          .eq('id', id)
          .select()

        if (deleteError) {
          if (itemToDelete) {
            setMilestones((prev) => [...prev, itemToDelete])
          }
          setError(`Could not delete task: ${deleteError.message}`)
        }
      } catch (err) {
        if (itemToDelete) {
          setMilestones((prev) => [...prev, itemToDelete])
        }
        setError(`Could not delete task: ${err.message || 'Network error'}`)
      }
    },
    [milestones, user]
  )

  // Delete a repeating task on `fromDay` and every later day in the same series
  const deleteSeries = useCallback(
    async (seriesId, fromDay) => {
      if (!seriesId || !user) return
      const removed = milestones.filter(
        (m) => m.series_id === seriesId && m.day_of_week >= fromDay
      )
      if (removed.length === 0) return

      const removedIds = new Set(removed.map((m) => m.id))
      setMilestones((prev) => prev.filter((m) => !removedIds.has(m.id)))
      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from('milestones')
          .delete()
          .eq('series_id', seriesId)
          .eq('week_start_date', weekStartDateString)
          .gte('day_of_week', fromDay)
          .select()

        if (deleteError) throw deleteError
      } catch (err) {
        // Roll back: put the removed tasks back in creation order
        setMilestones((prev) =>
          [...prev, ...removed].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          )
        )
        setError(`Could not delete repeating tasks: ${err.message || 'Network error'}`)
      }
    },
    [milestones, weekStartDateString, user]
  )

  // Complete all tasks in a series for the current week (master milestone + all daily subtasks)
  const completeSeriesInWeek = useCallback(
    async (seriesId) => {
      if (!seriesId || !user) return

      let previousMilestones = null

      setMilestones((prev) => {
        previousMilestones = prev
        return prev.map((item) => {
          if (item.series_id === seriesId) {
            return { ...item, is_completed: true }
          }
          return item
        })
      })
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from('milestones')
          .update({ is_completed: true })
          .eq('series_id', seriesId)
          .eq('week_start_date', weekStartDateString)

        if (updateError) {
          if (previousMilestones) setMilestones(previousMilestones)
          setError(`Could not complete series tasks: ${updateError.message}`)
        }
      } catch (err) {
        if (previousMilestones) setMilestones(previousMilestones)
        setError(`Could not complete series tasks: ${err.message || 'Network error'}`)
      }
    },
    [user, weekStartDateString]
  )

  const stats = useMemo(() => {
    const total = milestones.length
    const completed = milestones.filter((m) => m.is_completed).length
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

    let totalFocusMinutes = 0
    let totalBreakMinutes = 0

    milestones.forEach((m) => {
      totalFocusMinutes += m.duration_minutes ?? 30
      totalBreakMinutes += m.break_minutes ?? 5
    })

    return {
      total,
      completed,
      percent,
      totalFocusMinutes,
      totalBreakMinutes,
      totalBudgetedMinutes: totalFocusMinutes + totalBreakMinutes
    }
  }, [milestones])

  // Helper for computing detailed metrics for any day_of_week (0..7)
  const getDayStats = useCallback(
    (targetDay) => {
      const dayTasks = milestones.filter((m) => m.day_of_week === targetDay)
      const taskCount = dayTasks.length
      const completedCount = dayTasks.filter((m) => m.is_completed).length

      let focusMinutes = 0
      let breakMinutes = 0
      let careerFocusMinutes = 0
      let collegeFocusMinutes = 0
      let otherFocusMinutes = 0

      dayTasks.forEach((t) => {
        const dur = t.duration_minutes ?? 30
        const brk = t.break_minutes ?? 5
        focusMinutes += dur
        breakMinutes += brk

        const tag = t.tag || 'career'
        if (tag === 'career') {
          careerFocusMinutes += dur
        } else if (tag === 'college') {
          collegeFocusMinutes += dur
        } else {
          otherFocusMinutes += dur
        }
      })

      return {
        taskCount,
        completedCount,
        focusMinutes,
        breakMinutes,
        totalMinutes: focusMinutes + breakMinutes,
        careerFocusMinutes,
        collegeFocusMinutes,
        otherFocusMinutes
      }
    },
    [milestones]
  )

  return {
    milestones,
    loading,
    error,
    clearError: () => setError(null),
    addMilestone,
    addBatchMilestones,
    toggleMilestone,
    updateMilestone,
    moveMilestone,
    deleteMilestone,
    deleteSeries,
    completeSeriesInWeek,
    stats,
    getDayStats
  }
}
