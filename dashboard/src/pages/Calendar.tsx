import { useState } from 'react'
import { useApi } from '../hooks/useApi'

interface CalendarEvent {
  id?: string; title: string; start: string; end: string; location?: string; description?: string
}

export function Calendar() {
  const [view, setView] = useState<'today' | 'week'>('today')
  const { data: events } = useApi<CalendarEvent[]>(`/api/calendar/${view}`)

  // Group events by day for week view
  const groupedEvents: Record<string, CalendarEvent[]> = {}
  if (events) {
    for (const event of events) {
      const day = new Date(event.start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      if (!groupedEvents[day]) groupedEvents[day] = []
      groupedEvents[day].push(event)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📅 Calendar</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pixel-btn" onClick={() => setView('today')}
            style={view === 'today' ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}>
            Today
          </button>
          <button className="pixel-btn" onClick={() => setView('week')}
            style={view === 'week' ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}>
            This Week
          </button>
        </div>
      </div>

      {view === 'today' ? (
        <div className="card">
          <div className="card-title">📅 Today's Operations</div>
          {events && events.length > 0 ? (
            events.map((event, i) => (
              <div className="event-item" key={i}>
                <div className="event-time">
                  {new Date(event.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <div className="event-title">{event.title}</div>
                  {event.location && <div className="event-location">📍 {event.location}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏖️</div>
              <div>Clear day. The boss is off duty.</div>
            </div>
          )}
        </div>
      ) : (
        Object.entries(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents).map(([day, dayEvents]) => (
            <div className="card" key={day}>
              <div className="card-title">{day}</div>
              {dayEvents.map((event, i) => (
                <div className="event-item" key={i}>
                  <div className="event-time">
                    {new Date(event.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <div className="event-title">{event.title}</div>
                    {event.location && <div className="event-location">📍 {event.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div>Empty week. Suspiciously quiet.</div>
            </div>
          </div>
        )
      )}
    </div>
  )
}
