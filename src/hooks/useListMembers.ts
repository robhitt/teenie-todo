import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export function useListMembers(listId: string | undefined) {
  const [members, setMembers] = useState<Profile[]>([])

  useEffect(() => {
    if (!listId) {
      setMembers([])
      return
    }

    const load = async () => {
      // Get the list owner
      const { data: list } = await supabase
        .from('lists')
        .select('owner_id')
        .eq('id', listId)
        .single()

      if (!list) return

      // Get shared users
      const { data: shares } = await supabase
        .from('list_shares')
        .select('shared_with_id')
        .eq('list_id', listId)

      const userIds = [list.owner_id, ...(shares?.map((s) => s.shared_with_id) ?? [])]

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (profiles) {
        // Owner first, then shared users
        const sorted = profiles.sort((a, b) => {
          if (a.id === list.owner_id) return -1
          if (b.id === list.owner_id) return 1
          return 0
        })
        setMembers(sorted)
      }
    }

    load()
  }, [listId])

  return members
}
