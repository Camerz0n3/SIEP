import { useState } from 'react'
import { RoomHeader } from '../components/RoomHeader'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import type { Email } from '../types'
import styles from './Emails.module.css'

type Filter = 'all' | 'important' | 'koja' | 'personal'

function isKojaEmail(email: Email): boolean {
  const text = (email.from + email.subject + email.snippet).toLowerCase()
  return text.includes('koja') || text.includes('kojador') || text.includes('chalet')
}

function formatEmailTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHrs = diffMs / (1000 * 60 * 60)

  if (diffHrs < 24 && d.getDate() === now.getDate()) {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
  }
  if (diffHrs < 48) return 'YESTERDAY'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

export function Emails() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data: emails } = useAutoRefresh<Email[]>('/api/emails')

  const allEmails = emails ?? []
  const filtered = allEmails.filter((e) => {
    if (filter === 'important') return e.needsAction
    if (filter === 'koja') return isKojaEmail(e)
    if (filter === 'personal') return !isKojaEmail(e)
    return true
  })

  const importantCount = allEmails.filter(e => e.needsAction).length

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'important', label: 'IMPORTANT' },
    { id: 'koja', label: 'KOJA' },
    { id: 'personal', label: 'PERSONAL' },
  ]

  return (
    <>
      <RoomHeader
        icon={'\u{1F4E7}'}
        title="The Mail Room"
        subtitle={`${allEmails.length} deliveries \u2022 ${importantCount} with the red seal`}
      />
      <div className={styles.content}>
        {/* Siep filter summary */}
        <div className={styles.siepFilter}>
          <div className={styles.siepFilterAvatar}>{'\u{1F916}'}</div>
          <div className={styles.siepFilterText}>
            <span className={styles.siepLabel}>SIEP:</span>{' '}
            "Sorted through the mail boss. {allEmails.length} made the cut.
            {importantCount > 0 && ` ${importantCount} look${importantCount === 1 ? 's' : ''} important \u2014 gave those the red seal.`}
            {importantCount === 0 && ' Nothing urgent today.'}"
          </div>
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          {filters.map((f) => (
            <button
              key={f.id}
              className={`${styles.tab} ${filter === f.id ? styles.active : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Email list */}
        <div className={styles.emailList}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              {filter === 'all' ? "No mail today, boss. Quiet in the mail room." : `No ${filter} mail.`}
            </div>
          )}
          {filtered.slice(0, 15).map((email) => (
            <div
              key={email.id}
              className={`${styles.emailRow} ${email.needsAction ? styles.important : ''}`}
            >
              {/* Pixel envelope */}
              <div className={styles.envelopeWrap}>
                <div className={`${styles.envelope} ${email.needsAction ? styles.envelopeOpen : styles.envelopeSealed}`}>
                  <div className={styles.envelopeBody} />
                  <div className={styles.envelopeFlap} />
                  {email.needsAction && <div className={styles.waxSeal} />}
                </div>
              </div>

              <div className={styles.emailContent}>
                <div className={styles.emailFrom}>
                  {email.from.replace(/<.*>/, '').trim() || email.from}
                </div>
                <div className={styles.emailSubject}>{email.subject}</div>
                <div className={styles.emailSnippet}>{decodeEntities(email.snippet)}</div>
              </div>
              <div className={styles.emailTime}>{formatEmailTime(email.date)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
