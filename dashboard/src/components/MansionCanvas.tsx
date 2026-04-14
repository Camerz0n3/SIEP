import { useRef, useEffect } from 'react'
import { Application } from 'pixi.js'
import { MansionScene } from '../pixi/MansionScene'
import { useAppStore } from '../store'
import styles from './MansionCanvas.module.css'

export function MansionCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<MansionScene | null>(null)
  const appRef = useRef<Application | null>(null)
  const activeRoom = useAppStore((s) => s.activeRoom)
  const setActiveRoom = useAppStore((s) => s.setActiveRoom)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
      scene.build((id) => setActiveRoom(id))
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
  }, [setActiveRoom])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.setActiveRoom(activeRoom)
    scene.walkSiepTo(activeRoom)
  }, [activeRoom])

  return <div ref={containerRef} className={styles.canvas} />
}
