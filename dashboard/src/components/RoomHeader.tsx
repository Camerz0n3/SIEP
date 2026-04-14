import { useAppStore } from '../store'
import styles from './RoomHeader.module.css'

interface RoomHeaderProps {
  icon: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function RoomHeader({ icon, title, subtitle, children }: RoomHeaderProps) {
  const exitRoom = useAppStore((s) => s.exitRoom)

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={exitRoom}>
          {'<'} MANSION
        </button>
        <span className={styles.icon}>{icon}</span>
        <div>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.sub}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}
