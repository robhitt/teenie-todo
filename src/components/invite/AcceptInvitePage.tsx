import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    const accept = async () => {
      const { data, error: rpcError } = await supabase.rpc('accept_invite', {
        p_token: token,
      })

      if (rpcError) {
        setError(rpcError.message.includes('Invalid or expired')
          ? 'This invite link is invalid or has expired.'
          : 'Something went wrong. Please try again.')
        return
      }

      const listId = data as string
      navigate(`/list/${listId}`, { replace: true })
    }

    accept()
  }, [token, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-sm px-4 text-center">
          <h1 className="mb-2 text-xl font-semibold">Invite Error</h1>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <a href="/" className="text-sm text-primary underline">Go to home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground">Accepting invite...</div>
    </div>
  )
}
