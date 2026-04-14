import { create } from 'zustand'
import type { RoomId, CommsMessage, Notification, NotificationType } from './types'
import { playDoorOpen, playNotificationChime, playSendMessage, playReceiveMessage, playCashRegister } from './audio/engine'

const API_URL = import.meta.env.VITE_API_URL || ''

let msgCounter = 0
function nextId(): string {
  return `${Date.now()}-${++msgCounter}`
}

interface AppState {
  activeRoom: RoomId
  zoomed: boolean
  setActiveRoom: (room: RoomId) => void
  enterRoom: (room: RoomId) => void
  exitRoom: () => void

  commsMessages: CommsMessage[]
  commsLoading: boolean
  sendMessage: (text: string) => Promise<void>

  notifications: Notification[]
  addNotification: (type: NotificationType, title: string, message: string, room?: RoomId) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeRoom: 'office',
  zoomed: false,
  setActiveRoom: (room) => set({ activeRoom: room }),
  enterRoom: (room) => { playDoorOpen(); set({ activeRoom: room, zoomed: true }) },
  exitRoom: () => { playDoorOpen(); set({ zoomed: false }) },

  commsMessages: [
    {
      id: '0',
      sender: 'siep',
      text: "Morning boss. The mansion's all set up. Ask me anything — weather, schedule, tasks, you name it.",
      timestamp: new Date().toISOString(),
    },
  ],
  commsLoading: false,

  notifications: [],
  addNotification: (type, title, message, room) => {
    if (type === 'task') playCashRegister()
    else playNotificationChime()
    set((s) => ({
      notifications: [
        {
          id: nextId(),
          type,
          title,
          message,
          room,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...s.notifications,
      ].slice(0, 50),
    }))
  },
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),

  sendMessage: async (text: string) => {
    const userMsg: CommsMessage = {
      id: nextId(),
      sender: 'cameron',
      text,
      timestamp: new Date().toISOString(),
    }
    playSendMessage()
    set((s) => ({ commsMessages: [...s.commsMessages, userMsg], commsLoading: true }))

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      const siepMsg: CommsMessage = {
        id: nextId(),
        sender: 'siep',
        text: data.response || data.error || 'No response',
        timestamp: data.timestamp || new Date().toISOString(),
      }
      playReceiveMessage()
      set((s) => ({ commsMessages: [...s.commsMessages, siepMsg], commsLoading: false }))
    } catch {
      const errMsg: CommsMessage = {
        id: nextId(),
        sender: 'siep',
        text: "Hit a snag boss. Can't reach the server right now.",
        timestamp: new Date().toISOString(),
      }
      set((s) => ({ commsMessages: [...s.commsMessages, errMsg], commsLoading: false }))
    }
  },
}))
