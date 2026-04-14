import { useAppStore } from '../store'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { MansionCanvas } from './MansionCanvas'
import type { RoomId, Task, CalendarEvent, Email, Briefing } from '../types'
import styles from './LeftPanel.module.css'

const rooms: { id: RoomId; icon: string; name: string; mapLabel: string; label: string }[] = [
  { id: 'office', icon: '\u{1FA91}', name: 'The Office', mapLabel: 'THE OFFICE', label: 'HQ' },
  { id: 'calendar', icon: '\u{1F4C5}', name: 'The Board Room', mapLabel: 'BOARD ROOM', label: '' },
  { id: 'tasks', icon: '\u{1F4CB}', name: 'The Cork Board', mapLabel: 'CORK BOARD', label: '' },
  { id: 'emails', icon: '\u{1F4E7}', name: 'The Mail Room', mapLabel: 'MAIL ROOM', label: '' },
  { id: 'briefings', icon: '\u{1F4F0}', name: 'The Reading Room', mapLabel: 'READING ROOM', label: '' },
]

export function LeftPanel() {
  const activeRoom = useAppStore((s) => s.activeRoom)
  const setActiveRoom = useAppStore((s) => s.setActiveRoom)
  const { data: tasks } = useAutoRefresh<Task[]>('/api/tasks')
  const { data: events } = useAutoRefresh<CalendarEvent[]>('/api/calendar/today')
  const { data: emails } = useAutoRefresh<Email[]>('/api/emails')
  const { data: briefings } = useAutoRefresh<Briefing[]>('/api/briefings')

  const pendingTasks = tasks?.filter(t => t.status === 'pending')?.length ?? 0
  const todayEvents = events?.length ?? 0
  const emailCount = emails?.length ?? 0
  const hasBriefing = (briefings?.length ?? 0) > 0

  const statusText: Record<RoomId, string> = {
    office: 'Cameron & Lola',
    calendar: `${todayEvents} event${todayEvents !== 1 ? 's' : ''} today`,
    tasks: `${pendingTasks} pending`,
    emails: `${emailCount} recent`,
    briefings: hasBriefing ? "Today's brief ready" : 'No briefings yet',
  }

  const badges: Partial<Record<RoomId, { text: string; type: string }>> = {}
  if (emailCount > 0) badges.emails = { text: String(emailCount), type: 'alert' }

  return (
    <div className={styles.leftPanel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelTitle}>The Mansion</div>
          <div className={styles.panelSub}>CLICK A ROOM TO ENTER</div>
        </div>
      </div>

      {/* PixiJS isometric mansion view */}
      <div className={styles.mansionView}>
        <MansionCanvas />
      </div>

      {/* Room navigation list */}
      <div className={styles.roomList}>
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`${styles.roomItem} ${activeRoom === room.id ? styles.active : ''}`}
            onClick={() => setActiveRoom(room.id)}
          >
            <span className={styles.rIcon}>{room.icon}</span>
            <div className={styles.rInfo}>
              <div className={styles.rName}>{room.name}</div>
              <div className={styles.rStatus}>{statusText[room.id]}</div>
            </div>
            {room.id === 'office' && <span className={`${styles.rBadge} ${styles.ok}`}>HQ</span>}
            {badges[room.id] && <span className={styles.rBadge}>{badges[room.id]!.text}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
