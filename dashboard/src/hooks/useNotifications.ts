import { useEffect, useRef } from 'react'
import { useAutoRefresh } from './useAutoRefresh'
import { useAppStore } from '../store'
import type { Task, CalendarEvent, Email, Briefing } from '../types'

// Watches API data for changes and fires notifications via the store.
// Compares previous snapshot with current on each 60-second poll.

export function useNotifications() {
  const addNotification = useAppStore((s) => s.addNotification)

  const { data: tasks } = useAutoRefresh<Task[]>('/api/tasks')
  const { data: events } = useAutoRefresh<CalendarEvent[]>('/api/calendar/today')
  const { data: emails } = useAutoRefresh<Email[]>('/api/emails')
  const { data: briefings } = useAutoRefresh<Briefing[]>('/api/briefings')

  const prevTasks = useRef<Task[] | null>(null)
  const prevEmails = useRef<Email[] | null>(null)
  const prevBriefings = useRef<Briefing[] | null>(null)
  const eventAlerted = useRef<Set<string>>(new Set())

  // --- TASK changes ---
  useEffect(() => {
    if (!tasks || !prevTasks.current) {
      prevTasks.current = tasks ?? null
      return
    }
    const prev = prevTasks.current
    // Newly completed tasks
    for (const t of tasks) {
      if (t.status === 'completed') {
        const was = prev.find((p) => p.id === t.id)
        if (was && was.status !== 'completed') {
          addNotification('task', 'Task Complete', `"${t.title}" marked done.`, 'tasks')
        }
      }
    }
    // New tasks (id not in previous)
    const prevIds = new Set(prev.map((t) => t.id))
    for (const t of tasks) {
      if (!prevIds.has(t.id) && t.status === 'pending') {
        addNotification('task', 'New Task', `"${t.title}" added to the Cork Board.`, 'tasks')
      }
    }
    // Overdue tasks
    const now = new Date()
    for (const t of tasks) {
      if (t.status === 'pending' && t.due_date) {
        const due = new Date(t.due_date)
        const wasNotOverdue = prev.find((p) => p.id === t.id)
        if (due < now && wasNotOverdue && !wasNotOverdue.due_date) {
          addNotification('task', 'Overdue', `"${t.title}" is past due.`, 'tasks')
        }
      }
    }
    prevTasks.current = tasks
  }, [tasks, addNotification])

  // --- EMAIL changes ---
  useEffect(() => {
    if (!emails || !prevEmails.current) {
      prevEmails.current = emails ?? null
      return
    }
    const prevIds = new Set(prevEmails.current.map((e) => e.id))
    let newCount = 0
    let latestFrom = ''
    let latestSubject = ''
    for (const e of emails) {
      if (!prevIds.has(e.id)) {
        newCount++
        latestFrom = e.from
        latestSubject = e.subject
      }
    }
    if (newCount === 1) {
      addNotification('email', 'New Email', `From ${latestFrom}: ${latestSubject}`, 'emails')
    } else if (newCount > 1) {
      addNotification('email', 'New Emails', `${newCount} new messages in the Mail Room.`, 'emails')
    }
    prevEmails.current = emails
  }, [emails, addNotification])

  // --- CALENDAR event approaching ---
  useEffect(() => {
    if (!events) return
    const now = Date.now()
    for (const ev of events) {
      const start = new Date(ev.start).getTime()
      const minsUntil = (start - now) / 60000
      const key = ev.id || ev.title + ev.start
      if (minsUntil > 0 && minsUntil <= 15 && !eventAlerted.current.has(key)) {
        eventAlerted.current.add(key)
        const mins = Math.round(minsUntil)
        addNotification('event', 'Upcoming Meeting', `"${ev.title}" starts in ${mins} min.`, 'calendar')
      }
    }
  }, [events, addNotification])

  // --- BRIEFING changes ---
  useEffect(() => {
    if (!briefings || !prevBriefings.current) {
      prevBriefings.current = briefings ?? null
      return
    }
    const prevIds = new Set(prevBriefings.current.map((b) => b.id))
    for (const b of briefings) {
      if (!prevIds.has(b.id)) {
        addNotification('briefing', 'Briefing Ready', `New ${b.type} briefing from Siep.`, 'briefings')
      }
    }
    prevBriefings.current = briefings
  }, [briefings, addNotification])
}
