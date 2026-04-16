import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || localStorage.getItem('siep_api_key') || ''

export function getAuthHeaders(): Record<string, string> {
  const key = API_KEY || localStorage.getItem('siep_api_key') || ''
  return key ? { 'Authorization': `Bearer ${key}` } : {}
}

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}${path}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [path])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch }
}
