import { useMemo, useState, useCallback } from 'react'
import Fuse from 'fuse.js'
import type { Todo } from '@/types/database'

export function useSearch(items: Todo[]) {
  const [query, setQuery] = useState('')

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['text'],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [items]
  )

  const results = useMemo(() => {
    if (!query.trim()) return items
    return fuse.search(query).map((r) => r.item)
  }, [fuse, items, query])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
  }, [])

  return { query, setQuery: handleSearch, results }
}
