import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppDispatch } from '@/store/hooks'
import { realtimeUpsert, realtimeDelete } from '@/store/slices/todosSlice'
import type { Todo } from '@/types/database'

export function useRealtimeSubscription(listId: string | undefined) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!listId) return

    const channel = supabase
      .channel(`todos:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            dispatch(realtimeDelete((payload.old as { id: string }).id))
          } else {
            dispatch(realtimeUpsert(payload.new as Todo))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, dispatch])
}
