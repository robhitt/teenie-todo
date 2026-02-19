import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoginPage } from '@/components/auth/LoginPage'
import { AcceptInvitePage } from './AcceptInvitePage'
import type { User } from '@supabase/supabase-js'

export function InviteHandler() {
  const { token } = useParams<{ token: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    const redirectTo = `${window.location.origin}/invite/${token}`
    return <LoginPage redirectTo={redirectTo} />
  }

  return <AcceptInvitePage />
}
