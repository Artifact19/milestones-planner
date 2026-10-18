import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toDateString } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'

export function useWeeklyNote(weekStart) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const [loading, setLoading] = useState(true)

  const weekStartDateString = toDateString(weekStart)
  const debounceTimerRef = useRef(null)
  const activeWeekRef = useRef(weekStartDateString)

  activeWeekRef.current = weekStartDateString

  // Fetch note for the current week
  useEffect(() => {
    let ignore = false

    async function fetchNote() {
      if (!user) return
      setLoading(true)
      setSaveStatus('saved')

      try {
        const { data, error } = await supabase
          .from('weekly_notes')
          .select('note')
          .eq('week_start_date', weekStartDateString)
          .maybeSingle()

        if (!ignore) {
          if (!error && data) {
            setNote(data.note || '')
          } else {
            setNote('')
          }
        }
      } catch (err) {
        console.error('Error fetching weekly note:', err)
        if (!ignore) setNote('')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchNote()

    return () => {
      ignore = true
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [weekStartDateString, user])

  // Debounced save
  const saveNote = useCallback(
    (textToSave, targetWeek) => {
      if (!user) return

      setSaveStatus('saving')

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const { error } = await supabase.from('weekly_notes').upsert(
            {
              user_id: user.id,
              week_start_date: targetWeek,
              note: textToSave,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,week_start_date' }
          )

          if (error) {
            console.error('Failed to save weekly note:', error.message)
            setSaveStatus('error')
          } else if (activeWeekRef.current === targetWeek) {
            setSaveStatus('saved')
          }
        } catch (err) {
          console.error('Failed to save weekly note:', err)
          setSaveStatus('error')
        }
      }, 800)
    },
    [user]
  )

  const updateNote = (newText) => {
    setNote(newText)
    saveNote(newText, weekStartDateString)
  }

  return {
    note,
    updateNote,
    saveStatus,
    loading
  }
}
