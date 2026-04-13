import { useApi } from '../hooks/useApi'

interface Task {
  id: string; title: string; due_date?: string; priority: string; status: string; category: string
}
interface CalendarEvent {
  id?: string; title: string; start: string; end: string; location?: string
}
interface Weather {
  temperature: number; windspeed: number; description: string; high: number; low: number; snowfall: number
}

export function HQ() {
  const { data: tasks } = useApi<Task[]>('/api/tasks')
  const { data: events } = useApi<CalendarEvent[]>('/api/calendar/today')
  const { data: weather } = useApi<Weather>('/api/weather')
  const { data: overdue } = useApi<Task[]>('/api/tasks/overdue')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏠 Headquarters</h1>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-box">
          <div className="stat-value">{events?.length ?? '—'}</div>
          <div className="stat-label">Events Today</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{tasks?.length ?? '—'}</div>
          <div className="stat-label">Active Tasks</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: (overdue?.length ?? 0) > 0 ? 'var(--red)' : 'var(--green)' }}>
            {overdue?.length ?? '—'}
          </div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Weather */}
        <div className="card">
          <div className="card-title">🌤️ Verbier Weather</div>
          {weather ? (
            <div className="weather-widget">
              <div className="weather-temp">{weather.temperature}°C</div>
              <div className="weather-desc">{weather.description}</div>
              <div className="weather-details">
                <span>H: {weather.high}°</span>
                <span>L: {weather.low}°</span>
                <span>Wind: {weather.windspeed}km/h</span>
              </div>
              {weather.snowfall > 0 && (
                <div style={{ marginTop: 8, color: 'var(--blue)' }}>
                  ❄️ Fresh snow: {weather.snowfall}cm
                </div>
              )}
            </div>
          ) : (
            <div className="loading">Loading weather...</div>
          )}
        </div>

        {/* Today's schedule */}
        <div className="card">
          <div className="card-title">📅 Today's Schedule</div>
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
              <div>Clear day — no events scheduled.</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick tasks */}
      <div className="card">
        <div className="card-title">📋 Active Tasks</div>
        {tasks && tasks.length > 0 ? (
          tasks.slice(0, 5).map((task) => (
            <div className="task-item" key={task.id}>
              <div className="task-checkbox" />
              <span className="task-title">{task.title}</span>
              {task.due_date && (
                <span className={`task-due ${new Date(task.due_date) < new Date() ? 'overdue' : ''}`}>
                  {new Date(task.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              )}
              <span className={`task-priority ${task.priority}`}>{task.priority}</span>
              <span className="task-category">{task.category}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div>No tasks. Living the dream, boss.</div>
          </div>
        )}
      </div>
    </div>
  )
}
