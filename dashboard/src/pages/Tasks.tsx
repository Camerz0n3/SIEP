import { useState } from 'react'
import { useApi } from '../hooks/useApi'

interface Task {
  id: string; title: string; description?: string; due_date?: string; due_time?: string
  priority: string; status: string; category: string; created_at: string
}

export function Tasks() {
  const { data: tasks, refetch } = useApi<Task[]>('/api/tasks')
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue'>('all')

  const filteredTasks = tasks?.filter(t => {
    if (filter === 'today') {
      if (!t.due_date) return false
      const today = new Date().toISOString().split('T')[0]
      return t.due_date.startsWith(today)
    }
    if (filter === 'overdue') {
      return t.due_date && new Date(t.due_date) < new Date()
    }
    return true
  })

  const completeTask = async (id: string) => {
    await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' })
    refetch()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Tasks</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'today', 'overdue'] as const).map(f => (
            <button key={f} className="pixel-btn" onClick={() => setFilter(f)}
              style={filter === f ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {filteredTasks && filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div className="task-item" key={task.id}>
              <div
                className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                onClick={() => task.status !== 'completed' && completeTask(task.id)}
              />
              <span className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                {task.title}
              </span>
              {task.due_date && (
                <span className={`task-due ${new Date(task.due_date) < new Date() ? 'overdue' : ''}`}>
                  {new Date(task.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              )}
              <span className={`task-priority ${task.priority}`}>{task.priority}</span>
              <span className="task-category">{task.category}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div>{filter === 'overdue' ? 'Nothing overdue. Respect.' : 'No tasks. The boss takes a break.'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
