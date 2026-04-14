import { useState, useEffect } from 'react'

export type TimePeriod = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night'

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'evening'
  if (hour >= 20 || hour < 0) return 'night'
  return 'late-night'
}

export function useTimeOfDay() {
  const [period, setPeriod] = useState<TimePeriod>(() => getTimePeriod(new Date().getHours()))

  useEffect(() => {
    const update = () => {
      const p = getTimePeriod(new Date().getHours())
      setPeriod(p)
      document.documentElement.setAttribute('data-time', p)
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [])

  return period
}
