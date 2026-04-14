import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import type { NotificationType } from '../types'
import styles from './NotificationStack.module.css'

const TOAST_LIFETIME = 6000 // auto-dismiss after 6s

const ICONS: Record<NotificationType, string> = {
  email: '\u{1F4E8}',
  task: '\u{2705}',
  event: '\u{1F514}',
  briefing: '\u{1F4F0}',
  system: '\u{1F916}',
}

export function NotificationStack() {
  const notifications = useAppStore((s) => s.notifications)
  const dismiss = useAppStore((s) => s.dismissNotification)
  const enterRoom = useAppStore((s) => s.enterRoom)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Auto-dismiss each notification after TOAST_LIFETIME
  useEffect(() => {
    for (const n of notifications) {
      if (!timers.current.has(n.id)) {
        timers.current.set(
          n.id,
          setTimeout(() => {
            dismiss(n.id)
            timers.current.delete(n.id)
          }, TOAST_LIFETIME)
        )
      }
    }
    // Clean up stale timers
    for (const [id, timer] of timers.current) {
      if (!notifications.find((n) => n.id === id)) {
        clearTimeout(timer)
        timers.current.delete(id)
      }
    }
  }, [notifications, dismiss])

  // Show only the 4 most recent
  const visible = notifications.slice(0, 4)

  if (visible.length === 0) return null

  return (
    <div className={styles.stack}>
      {visible.map((n, i) => (
        <div
          key={n.id}
          className={`${styles.toast} ${styles[n.type]}`}
          style={{ animationDelay: `${i * 0.05}s` }}
          onClick={() => {
            if (n.room) enterRoom(n.room)
            dismiss(n.id)
          }}
        >
          <span className={styles.icon}>{ICONS[n.type]}</span>
          <div className={styles.body}>
            <div className={styles.title}>{n.title}</div>
            <div className={styles.message}>{n.message}</div>
          </div>
          <button
            className={styles.close}
            onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
