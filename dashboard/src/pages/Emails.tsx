import { useApi } from '../hooks/useApi'

interface Email {
  id: string; from: string; subject: string; snippet: string; date: string; account: string; needsAction: boolean
}

export function Emails() {
  const { data: emails, loading, refetch } = useApi<Email[]>('/api/emails')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📧 Emails</h1>
        <button className="pixel-btn" onClick={refetch}>Refresh</button>
      </div>

      <div className="card">
        <div className="card-title">📨 Last 24 Hours</div>
        {loading ? (
          <div className="loading">Scanning the wire...</div>
        ) : emails && emails.length > 0 ? (
          emails.map(email => (
            <div className="email-item" key={email.id}>
              <div className="email-from">{email.from.replace(/<.*>/, '').trim()}</div>
              <div className="email-subject">{email.subject}</div>
              <div className="email-snippet">{email.snippet}</div>
              <span className={`email-account ${email.account}`}>{email.account}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div>Inbox is clean. No intel to report.</div>
          </div>
        )}
      </div>
    </div>
  )
}
