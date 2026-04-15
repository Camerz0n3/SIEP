export function formatTime(iso: string | undefined | null): string {
  if (!iso) return '--:--'
  // Extract time directly from ISO string to preserve original timezone
  const match = iso.match(/T(\d{2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '--:--'
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

export function formatTimeRange(startIso: string | undefined | null, endIso: string | undefined | null): string {
  return `${formatTime(startIso)} - ${formatTime(endIso)}`
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '--'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatFullDate(iso: string | undefined | null): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '--'
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatCountdown(start: string): string {
  const diff = new Date(start).getTime() - Date.now()
  if (isNaN(diff)) return '--'
  if (diff < 0) return 'Started'
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `Starts in ${mins} min${mins !== 1 ? 's' : ''}`
  const hrs = Math.floor(mins / 60)
  return `Starts in ${hrs}h ${mins % 60}m`
}
