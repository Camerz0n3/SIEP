import { useState, useEffect, useCallback } from 'react'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { isMuted, toggleMute } from '../audio/engine'
import type { Task, Email } from '../types'
import styles from './TopBar.module.css'

export function TopBar() {
  const [clock, setClock] = useState('')
  const [muted, setMutedState] = useState(isMuted)
  const handleToggleMute = useCallback(() => {
    const m = toggleMute()
    setMutedState(m)
  }, [])
  const { data: tasks } = useAutoRefresh<Task[]>('/api/tasks')
  const { data: emails } = useAutoRefresh<Email[]>('/api/emails')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(
        now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0')
      )
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  const activeTasks = tasks?.filter(t => t.status === 'pending') ?? []
  const totalTasks = tasks?.length ?? 0
  const completedTasks = totalTasks - activeTasks.length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const unreadEmails = emails?.filter(e => e.needsAction)?.length ?? emails?.length ?? 0

  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          S.I.E.P <span className={styles.logoSub}>THE MANSION</span>
        </div>
        <div className={styles.mansionStatus}>
          <span className="status-dot" />
          MANSION ONLINE
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.guardStatus}>
          <span className={styles.shield}>&#x1F6E1;&#xFE0F;</span>
          2 GUARDS ON DUTY
        </div>
        <div className={styles.pill}>
          <span className={styles.pillLabel}>Tasks</span>
          <span className={styles.pillValue}>{activeTasks.length}/{totalTasks}</span>
        </div>
        <div className={`${styles.pill} ${styles.pillUrgent}`}>
          <span className={styles.pillLabel}>Complete</span>
          <span className={styles.pillValue}>{completionPct}%</span>
        </div>
        <div className={styles.pill}>
          <span className={styles.pillLabel}>Emails</span>
          <span className={styles.pillValue}>{unreadEmails} new</span>
        </div>
        <button
          className={`${styles.pill} ${styles.muteBtn}`}
          onClick={handleToggleMute}
          title={muted ? 'Unmute' : 'Mute'}
        >
          <span>{muted ? '\u{1F507}' : '\u{1F50A}'}</span>
        </button>
        <div className={styles.clock}>{clock}</div>
      </div>
    </div>
  )
}
