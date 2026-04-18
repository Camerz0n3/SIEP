import { RoomHeader } from '../components/RoomHeader'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatDate } from '../utils/time'
import type { Task } from '../types'
import styles from './Tasks.module.css'

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status !== 'pending') return false
  // If no time given, deadline is end-of-day local; otherwise combine date + time.
  const deadline = task.due_time
    ? new Date(`${task.due_date}T${task.due_time}`)
    : new Date(`${task.due_date}T23:59:59`)
  if (Number.isNaN(deadline.getTime())) return false
  return deadline.getTime() < Date.now()
}

export function Tasks() {
  const { data: tasks, loading, error } = useAutoRefresh<Task[]>('/api/tasks')
  const hasData = tasks !== null

  const pending = tasks?.filter(t => t.status === 'pending') ?? []
  const completed = tasks?.filter(t => t.status === 'completed') ?? []

  const urgent = pending.filter(t => t.priority === 'high' || isOverdue(t))
  const active = pending.filter(t => t.priority === 'normal' && !isOverdue(t))
  const backlog = pending.filter(t => t.priority === 'low' && !isOverdue(t))

  // Filter to recently completed tasks — Date.now() is intentionally impure (time-dependent UI)
  // eslint-disable-next-line react-hooks/purity
  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000
  const recentCompleted = completed.filter(t =>
    t.completed_at && new Date(t.completed_at).getTime() > fiveDaysAgo
  )

  const renderCard = (task: Task) => {
    const isUrgent = task.priority === 'high' || isOverdue(task)
    const isLow = task.priority === 'low'
    const pinClass = isUrgent ? styles.pinRed : isLow ? styles.pinGrey : styles.pinGold
    return (
      <div key={task.id} className={styles.taskCard}>
        {/* Pin head */}
        <div className={`${styles.pinHead} ${pinClass}`}>
          <div className={styles.pinShine} />
        </div>
        <div className={styles.pinNeedle} />
        <div className={styles.cardBody}>
          <div className={styles.taskTitle}>{task.title}</div>
          {task.description && (
            <div className={styles.taskDesc}>{task.description}</div>
          )}
          <div className={styles.taskMeta}>
            {task.category && <span className={styles.taskCat}>{task.category}</span>}
            {task.due_date && (
              <span className={`${styles.taskDue} ${isOverdue(task) ? styles.overdue : ''}`}>
                {isOverdue(task) ? 'OVERDUE \u2014 ' : ''}{formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <RoomHeader
        icon={'\u{1F4CB}'}
        title="The Cork Board"
        subtitle={hasData
          ? `${pending.length} pinned \u2022 ${completed.length} filed in the cabinet`
          : error ? `Couldn't reach the board \u2014 ${error}` : 'Checking the board...'}
      />
      <div className={styles.content}>
        {/* Cork board surface */}
        <div className={styles.corkboard}>
          <div className={styles.corkboardInner}>
            {urgent.length > 0 && (
              <div className={styles.section}>
                <div className={`${styles.sectionLabel} ${styles.urgentLabel}`}>
                  <span className={styles.sectionDot} style={{ background: 'var(--red-bright)' }} />
                  URGENT
                </div>
                <div className={styles.cardGrid}>{urgent.map(renderCard)}</div>
              </div>
            )}

            {active.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>
                  <span className={styles.sectionDot} style={{ background: 'var(--gold)' }} />
                  ACTIVE
                </div>
                <div className={styles.cardGrid}>{active.map(renderCard)}</div>
              </div>
            )}

            {backlog.length > 0 && (
              <div className={styles.section}>
                <div className={`${styles.sectionLabel} ${styles.backlogLabel}`}>
                  <span className={styles.sectionDot} style={{ background: 'var(--text-muted)' }} />
                  BACKLOG
                </div>
                <div className={styles.cardGrid}>{backlog.map(renderCard)}</div>
              </div>
            )}

            {hasData && pending.length === 0 && (
              <div className={styles.emptyState}>
                Board's empty, boss. Nothing pinned up. Enjoy the quiet.
              </div>
            )}
            {!hasData && loading && (
              <div className={styles.emptyState}>
                Siep's pulling the pins off the board...
              </div>
            )}
          </div>
        </div>

        {/* Filing cabinet */}
        {recentCompleted.length > 0 && (
          <div className={styles.filingCabinet}>
            <div className={styles.cabinetHeader}>
              <span className={styles.cabinetIcon}>{'\u{1F5C4}\u{FE0F}'}</span>
              FILING CABINET &mdash; Last 5 days ({recentCompleted.length} filed)
            </div>
            {recentCompleted.map((task) => (
              <div key={task.id} className={styles.completedItem}>
                <span className={styles.checkmark}>{'\u2714'}</span>
                <span className={styles.strike}>{task.title}</span>
                {task.completed_at && (
                  <span className={styles.completedDate}>{formatDate(task.completed_at)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
