import { useState } from 'react'
import { RoomHeader } from '../components/RoomHeader'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatTimeRange } from '../utils/time'
import type { CalendarEvent } from '../types'
import styles from './Calendar.module.css'

function getDayLabel(date: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return days[date.getDay()]
}

function isToday(date: Date): boolean {
  const now = new Date()
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
}

function isKojaEvent(event: CalendarEvent): boolean {
  const t = (event.title + (event.description || '')).toLowerCase()
  return t.includes('koja') || t.includes('work') || t.includes('team') || t.includes('sync')
}

type View = 'today' | 'weekly' | 'monthly'

export function Calendar() {
  const [view, setView] = useState<View>('weekly')
  const { data: weekEvents } = useAutoRefresh<CalendarEvent[]>('/api/calendar/week')
  const { data: monthEvents } = useAutoRefresh<CalendarEvent[]>('/api/calendar/month')
  const { data: todayEvents, error: todayError } = useAutoRefresh<CalendarEvent[]>('/api/calendar/today')

  const events = view === 'monthly' ? monthEvents : view === 'weekly' ? weekEvents : todayEvents
  const todayLoaded = todayEvents !== null

  // Group events by date
  const grouped: Record<string, CalendarEvent[]> = {}
  events?.forEach((e) => {
    const key = new Date(e.start).toDateString()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  // Build day range starting from today (7 for week/today, 21 for monthly)
  const dayCount = view === 'monthly' ? 21 : 7
  const days: Date[] = []
  const today = new Date()
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }

  const renderDayCol = (day: Date) => {
    const key = day.toDateString()
    const dayEvents = grouped[key] || []
    const isToday_ = isToday(day)
    return (
      <div key={key} className={`${styles.dayCol} ${isToday_ ? styles.today : ''}`}>
        <div className={styles.dayHeader}>
          <span className={styles.dayName}>{getDayLabel(day)}</span>
          <span className={styles.dayNum}>{day.getDate()}</span>
        </div>
        <div className={styles.dayEvents}>
          {dayEvents.length === 0 && (
            <div className={styles.empty}>{'\u2014'}</div>
          )}
          {dayEvents.map((evt) => {
            const work = isKojaEvent(evt)
            const eventKey = `${evt.start}-${evt.title}`
            return (
              <div
                key={eventKey}
                className={`${styles.eventCard} ${work ? styles.work : styles.personal}`}
              >
                <div className={styles.eventTime}>{formatTimeRange(evt.start, evt.end)}</div>
                <div className={styles.eventTitle}>{evt.title}</div>
                {evt.location && <div className={styles.eventLoc}>{evt.location}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const weekRows: Date[][] = view === 'monthly'
    ? [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21)]
    : [days]

  return (
    <>
      <RoomHeader
        icon={'\u{1F4C5}'}
        title="The Board Room"
        subtitle={todayLoaded
          ? `${todayEvents?.length ?? 0} events today \u2014 the whiteboard never lies`
          : todayError
          ? `Couldn't reach the board \u2014 ${todayError}`
          : 'Chalking up the whiteboard...'}
      />
      <div className={styles.content}>
        {/* Whiteboard frame */}
        <div className={styles.whiteboard}>
          {/* Whiteboard header with marker-style tabs */}
          <div className={styles.whiteboardHeader}>
            <div className={styles.markerTabs}>
              <button
                className={`${styles.markerTab} ${view === 'weekly' ? styles.active : ''}`}
                onClick={() => setView('weekly')}
              >
                <span className={styles.markerDot} style={{ background: 'var(--gold)' }} />
                THIS WEEK
              </button>
              <button
                className={`${styles.markerTab} ${view === 'monthly' ? styles.active : ''}`}
                onClick={() => setView('monthly')}
              >
                <span className={styles.markerDot} style={{ background: 'var(--gold)' }} />
                THIS MONTH
              </button>
              <button
                className={`${styles.markerTab} ${view === 'today' ? styles.active : ''}`}
                onClick={() => setView('today')}
              >
                <span className={styles.markerDot} style={{ background: 'var(--blue-cold)' }} />
                TODAY ONLY
              </button>
            </div>
            <div className={styles.monthLabel}>
              {today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
          </div>

          {/* Day grid — 1 row for weekly/today, 3 rows for monthly */}
          <div className={view === 'monthly' ? styles.monthGrid : ''}>
            {weekRows.map((row, rowIdx) => (
              <div key={rowIdx} className={styles.weekGrid}>
                {row.map(renderDayCol)}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: 'var(--gold)' }} />
            <span>Personal</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: 'var(--blue-cold)' }} />
            <span>Koja / Work</span>
          </div>
        </div>
      </div>
    </>
  )
}
