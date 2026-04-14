import { useRef, useEffect } from 'react'
import { Application } from 'pixi.js'
import { MansionScene } from '../pixi/MansionScene'
import { useAppStore } from '../store'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import type { RoomId, Task, CalendarEvent, Email, Briefing } from '../types'
import styles from './MansionOverview.module.css'

const rooms: { id: RoomId; icon: string; name: string }[] = [
  { id: 'office', icon: '\u{1FA91}', name: 'The Office' },
  { id: 'calendar', icon: '\u{1F4C5}', name: 'The Board Room' },
  { id: 'tasks', icon: '\u{1F4CB}', name: 'The Cork Board' },
  { id: 'emails', icon: '\u{1F4E7}', name: 'The Mail Room' },
  { id: 'briefings', icon: '\u{1F4F0}', name: 'The Reading Room' },
]

export function MansionOverview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<MansionScene | null>(null)
  const appRef = useRef<Application | null>(null)
  const activeRoom = useAppStore((s) => s.activeRoom)
  const enterRoom = useAppStore((s) => s.enterRoom)
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

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const app = new Application()
    let destroyed = false

    app.init({
      background: 0x0a0806,
      resizeTo: container,
      antialias: false,
      resolution: 2,
      autoDensity: true,
    }).then(() => {
      if (destroyed || !container.isConnected) { app.destroy(); return }
      container.appendChild(app.canvas)
      appRef.current = app
      const scene = new MansionScene(app)
      sceneRef.current = scene
      scene.build((id) => {
        enterRoom(id)
      })
    })

    const handleResize = () => sceneRef.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      destroyed = true
      window.removeEventListener('resize', handleResize)
      sceneRef.current?.destroy()
      sceneRef.current = null
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [enterRoom])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.setActiveRoom(activeRoom)
    scene.walkSiepTo(activeRoom)
  }, [activeRoom])

  // Watch notifications and trigger PixiJS effects
  const notifications = useAppStore((s) => s.notifications)
  const lastNotifId = useRef<string | null>(null)
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || notifications.length === 0) return
    const latest = notifications[0]
    if (latest.id === lastNotifId.current) return
    lastNotifId.current = latest.id
    // Trigger PixiJS scene effects
    if (latest.room) {
      scene.notify(latest.message, latest.room)
    } else {
      scene.showBubble(latest.message, 4)
    }
  }, [notifications])

  return (
    <div className={styles.wrapper}>
      {/* PixiJS mansion — full width hero */}
      <div ref={containerRef} className={styles.canvas} />

      {/* Room bar at the bottom of the mansion */}
      <div className={styles.roomBar}>
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`${styles.roomChip} ${activeRoom === room.id ? styles.active : ''}`}
            onMouseEnter={() => setActiveRoom(room.id)}
            onClick={() => enterRoom(room.id)}
          >
            <span className={styles.chipIcon}>{room.icon}</span>
            <div className={styles.chipInfo}>
              <div className={styles.chipName}>{room.name}</div>
              <div className={styles.chipStatus}>{statusText[room.id]}</div>
            </div>
            {room.id === 'emails' && emailCount > 0 && (
              <span className={styles.chipBadge}>{emailCount}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
