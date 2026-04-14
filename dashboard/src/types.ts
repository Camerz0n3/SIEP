export interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  due_time?: string
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'completed'
  category: string
  created_at: string
  completed_at?: string
}

export interface CalendarEvent {
  id?: string
  title: string
  start: string
  end: string
  location?: string
  description?: string
}

export interface Email {
  id: string
  from: string
  subject: string
  snippet: string
  date: string
  account: string
  needsAction: boolean
}

export interface Briefing {
  id: string
  type: 'daily' | 'weekly' | string
  content: string
  sent_at: string
}

export interface Weather {
  temperature: number
  windspeed: number
  description: string
  high: number
  low: number
  snowfall: number
}

export interface CommsMessage {
  id: string
  sender: 'cameron' | 'siep'
  text: string
  timestamp: string
}

export type RoomId = 'office' | 'calendar' | 'tasks' | 'emails' | 'briefings'

// === Notifications ===

export type NotificationType = 'email' | 'task' | 'event' | 'briefing' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  room?: RoomId
  timestamp: string
  read: boolean
}
