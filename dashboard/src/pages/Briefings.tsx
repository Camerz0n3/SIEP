import { useApi } from '../hooks/useApi'

interface Briefing {
  id: string; type: string; content: string; sent_at: string
}

export function Briefings() {
  const { data: briefings, loading } = useApi<Briefing[]>('/api/briefings')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📰 Briefings</h1>
      </div>

      {loading ? (
        <div className="loading">Loading dossiers...</div>
      ) : briefings && briefings.length > 0 ? (
        briefings.map(briefing => (
          <div className="card" key={briefing.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span className="briefing-type">{briefing.type}</span>
              <span className="briefing-date">
                {new Date(briefing.sent_at).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            <div className="briefing-content">{briefing.content}</div>
          </div>
        ))
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <div>No briefings yet. Siep hasn't filed his first report.</div>
          </div>
        </div>
      )}
    </div>
  )
}
