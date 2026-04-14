import { useEffect } from 'react'
import { useApi } from './useApi'

export function useAutoRefresh<T>(path: string, intervalMs = 60000) {
  const api = useApi<T>(path)

  useEffect(() => {
    const timer = setInterval(api.refetch, intervalMs)
    return () => clearInterval(timer)
  }, [api.refetch, intervalMs])

  return api
}
