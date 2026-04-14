import { useEffect as useEffectOnce } from 'react'
import { useTimeOfDay } from './hooks/useTimeOfDay'
import { useNotifications } from './hooks/useNotifications'
import { startAmbient } from './audio/engine'
import { useAppStore } from './store'
import type { RoomId } from './types'
import { TopBar } from './components/TopBar'
import { LeftPanel } from './components/LeftPanel'
import { MansionOverview } from './components/MansionOverview'
import { CommsPanel } from './components/CommsPanel'
import { NotificationStack } from './components/NotificationStack'
import { Office } from './rooms/Office'
import { Calendar } from './rooms/Calendar'
import { Tasks } from './rooms/Tasks'
import { Emails } from './rooms/Emails'
import { Briefings } from './rooms/Briefings'
import styles from './styles/App.module.css'

const TABS: { id: RoomId; icon: string; label: string }[] = [
  { id: 'office', icon: '\u{1FA91}', label: 'HQ' },
  { id: 'calendar', icon: '\u{1F4C5}', label: 'BOARD' },
  { id: 'tasks', icon: '\u{1F4CB}', label: 'TASKS' },
  { id: 'emails', icon: '\u{1F4E7}', label: 'MAIL' },
  { id: 'briefings', icon: '\u{1F4F0}', label: 'NEWS' },
]

function MobileTabBar() {
  const activeRoom = useAppStore((s) => s.activeRoom)
  const enterRoom = useAppStore((s) => s.enterRoom)
  return (
    <div className={styles.mobileTabBar}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`${styles.mobileTab} ${activeRoom === t.id ? styles.mobileTabActive : ''}`}
          onClick={() => enterRoom(t.id)}
        >
          <span>{t.icon}</span>
          <span className={styles.mobileTabLabel}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

const roomComponents = {
  office: Office,
  calendar: Calendar,
  tasks: Tasks,
  emails: Emails,
  briefings: Briefings,
} as const

export default function App() {
  useTimeOfDay()
  useNotifications()
  // Start ambient audio on first user interaction
  useEffectOnce(() => {
    const start = () => { startAmbient(); document.removeEventListener('click', start) }
    document.addEventListener('click', start)
    return () => document.removeEventListener('click', start)
  }, [])
  const activeRoom = useAppStore((s) => s.activeRoom)
  const zoomed = useAppStore((s) => s.zoomed)
  const ActiveRoomComponent = roomComponents[activeRoom]

  return (
    <>
      <div className="ambient-smoke" />
      <NotificationStack />
      {zoomed ? (
        /* ===== ZOOMED: Room view — left nav + right room content ===== */
        <div className={styles.dashboard}>
          <TopBar />
          <LeftPanel />
          <div className={styles.rightPanel}>
            <ActiveRoomComponent />
          </div>
          <CommsPanel />
          <MobileTabBar />
        </div>
      ) : (
        /* ===== OVERVIEW: Mansion is the hero ===== */
        <div className={styles.overview}>
          <TopBar />
          <MansionOverview />
          <CommsPanel />
          <MobileTabBar />
        </div>
      )}
    </>
  )
}
