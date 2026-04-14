import { useState } from 'react'
import { RoomHeader } from '../components/RoomHeader'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatTime } from '../utils/time'
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

export function Calendar() {
  const [view, setView] = useState<'weekly' | 'today'>('weekly')
  const { data: weekEvents } = useAutoRefresh<CalendarEvent[]>('/api/calendar/week')
  const { data: todayEvents } = useAutoRefresh<CalendarEvent[]>('/api/calendar/today')

  const events = view === 'weekly' ? weekEvents : todayEvents

  // Group events by date
  const grouped: Record<string, CalendarEvent[]> = {}
  events?.forEach((e) => {
    const key = new Date(e.start).toDateString()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  // Build 7-day range starting from today
  const days: Date[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }

  return (
    <>
      <RoomHeader
        icon={'\u{1F4C5}'}
        title="The Board Room"
        subtitle={`${todayEvents?.length ?? 0} events today \u2014 the whiteboard never lies`}
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

          {/* Week grid on the whiteboard */}
          <div className={styles.weekGrid}>
            {days.map((day) => {
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
                          <div className={styles.eventTime}>{formatTime(evt.start)}</div>
                          <div className={styles.eventTitle}>{evt.title}</div>
                          {evt.location && <div className={styles.eventLoc}>{evt.location}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
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
