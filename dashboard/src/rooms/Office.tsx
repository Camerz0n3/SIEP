import { RoomHeader } from '../components/RoomHeader'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useAppStore } from '../store'
import { formatTime, formatCountdown } from '../utils/time'
import type { Task, CalendarEvent, Weather, Email, Briefing } from '../types'
import styles from './Office.module.css'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Morning boss. Got your day lined up."
  if (h < 17) return "Afternoon boss. Quiet one so far."
  return "Evening boss. Long day but we're still standing."
}

export function Office() {
  const { data: tasks } = useAutoRefresh<Task[]>('/api/tasks')
  const { data: events } = useAutoRefresh<CalendarEvent[]>('/api/calendar/today')
  const { data: weather } = useAutoRefresh<Weather>('/api/weather')
  const { data: emails } = useAutoRefresh<Email[]>('/api/emails')
  const { data: briefings } = useAutoRefresh<Briefing[]>('/api/briefings')
  const setActiveRoom = useAppStore((s) => s.setActiveRoom)

  const pendingTasks = tasks?.filter(t => t.status === 'pending') ?? []
  const urgentTasks = pendingTasks.filter(t => t.priority === 'high').length
  const normalTasks = pendingTasks.length - urgentTasks
  const totalTasks = tasks?.length ?? 0
  const completedTasks = totalTasks - pendingTasks.length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const unreadEmails = emails?.length ?? 0
  const importantEmails = emails?.filter(e => e.needsAction)?.length ?? 0

  // Filter to next upcoming event — Date.now() is intentionally impure here (time-dependent UI)
  // eslint-disable-next-line react-hooks/purity
  const nextEvent = events?.filter(e => new Date(e.start).getTime() > Date.now())?.[0]

  const latestBriefing = briefings?.[0]

  const tasksLoaded = tasks !== null
  const emailsLoaded = emails !== null
  const eventsLoaded = events !== null

  return (
    <>
      <RoomHeader
        icon={'\u{1FA91}'}
        title="The Office"
        subtitle="Your command centre"
      >
        <span className={styles.lolaTag}>{'\u2764\uFE0F'} Lola is here</span>
      </RoomHeader>
      <div className={styles.content}>
        {/* Siep status */}
        <div className={styles.siepCard}>
          <div className={styles.siepAvatar}>{'\u{1F916}'}</div>
          <div className={styles.siepInfo}>
            <div className={styles.siepName}>SIEP &mdash; ROBOT BUTLER</div>
            <div className={styles.siepSays}>"{getGreeting()}"</div>
            <div className={styles.siepActivity}>
              <span className="status-dot" /> Currently in: The Office &mdash; Idle (adjusting cufflinks)
            </div>
          </div>
        </div>

        {/* Status cards */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Next Meeting</div>
            <div className={`${styles.cardValue} ${styles.gold}`}>
              {!eventsLoaded ? '\u2014' : nextEvent ? formatTime(nextEvent.start) : '--:--'}
            </div>
            <div className={styles.cardDetail}>
              {!eventsLoaded
                ? 'Checking the calendar...'
                : nextEvent
                ? `${nextEvent.title} \u2014 ${formatCountdown(nextEvent.start)}`
                : 'No meetings today'}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Verbier Weather</div>
            <div className={styles.cardValue}>
              {weather ? `${weather.temperature}\u00B0C` : '\u2014'}
            </div>
            <div className={styles.cardDetail}>
              {weather ? weather.description : 'Checking the sky...'}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Tasks Today</div>
            <div className={`${styles.cardValue} ${styles.gold}`}>
              {tasksLoaded ? pendingTasks.length : '\u2014'}
            </div>
            <div className={styles.cardDetail}>
              {tasksLoaded ? `${urgentTasks} urgent, ${normalTasks} normal` : 'Counting pins...'}
            </div>
            <div className={styles.completionBar}>
              <div className={styles.fill} style={{ width: `${completionPct}%` }} />
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Unread Emails</div>
            <div className={styles.cardValue}>
              {emailsLoaded ? unreadEmails : '\u2014'}
            </div>
            <div className={styles.cardDetail}>
              {emailsLoaded ? `${importantEmails} flagged as important` : 'Sorting the mail...'}
            </div>
          </div>
        </div>

        {/* Next meeting detail */}
        {nextEvent && (
          <div className={styles.nextMeeting}>
            <div className={styles.nmLabel}>Up Next</div>
            <div className={styles.nmTitle}>{nextEvent.title}</div>
            <div className={styles.nmTime}>
              {formatTime(nextEvent.start)} &mdash; {formatTime(nextEvent.end)}
              {nextEvent.location && <> &bull; {nextEvent.location}</>}
            </div>
            <div className={styles.nmCountdown}>{formatCountdown(nextEvent.start)}</div>
          </div>
        )}

        {/* Briefing teaser */}
        {latestBriefing && (
          <div className={styles.briefingTeaser}>
            <div className={styles.briefingAvatar}>{'\u{1F4F0}'}</div>
            <div className={styles.briefingInfo}>
              <div className={styles.briefingName}>TODAY'S BRIEFING</div>
              <div className={styles.briefingText}>
                {latestBriefing.content.slice(0, 200)}
                {latestBriefing.content.length > 200 ? '...' : ''}
              </div>
              <div className={styles.briefingLink}>
                Generated at {formatTime(latestBriefing.sent_at)} &mdash;{' '}
                <span onClick={() => setActiveRoom('briefings')} className={styles.link}>
                  View full briefing &rarr;
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
