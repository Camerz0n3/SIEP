import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store'
import styles from './CommsPanel.module.css'

export function CommsPanel() {
  const [input, setInput] = useState('')
  const messages = useAppStore((s) => s.commsMessages)
  const loading = useAppStore((s) => s.commsLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
  }

  return (
    <div className={styles.comms}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span>&#x1F916;</span> MANSION COMMS
        </div>
        <div className={styles.online}>
          <span className="status-dot" />
          SIEP ONLINE
        </div>
      </div>

      <div className={styles.body} ref={bodyRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.msg} ${styles[msg.sender]}`}>
            <div className={styles.avatar}>
              {msg.sender === 'siep' ? '\u{1F916}' : 'C'}
            </div>
            <div className={styles.content}>
              <div className={styles.name}>
                {msg.sender === 'siep' ? 'SIEP' : 'CAMERON'}
              </div>
              <div className={styles.text}>{msg.text}</div>
              <div className={styles.time}>{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.msg} ${styles.siep}`}>
            <div className={styles.avatar}>{'\u{1F916}'}</div>
            <div className={styles.content}>
              <div className={styles.name}>SIEP</div>
              <div className={styles.typing}>Thinking<span className={styles.dots}>...</span></div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          placeholder="Talk to Siep... (e.g. 'Book La Vache for 8pm tonight')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          SEND
        </button>
      </div>
    </div>
  )
}
