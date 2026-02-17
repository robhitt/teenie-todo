import { useState, useEffect } from 'react'
import { UserPlus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/types/database'

interface ShareListDialogProps {
  listId: string
  isOpen: boolean
  onClose: () => void
}

interface ShareEntry {
  id: string
  shared_with_id: string
  profile: Profile
}

export function ShareListDialog({ listId, isOpen, onClose }: ShareListDialogProps) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState<ShareEntry[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadShares()
    }
  }, [isOpen, listId])

  const loadShares = async () => {
    const { data } = await supabase
      .from('list_shares')
      .select('id, shared_with_id, profiles!list_shares_shared_with_id_fkey(id, email, display_name, avatar_url, created_at)')
      .eq('list_id', listId)

    if (data) {
      setShares(
        data.map((s) => ({
          id: s.id,
          shared_with_id: s.shared_with_id,
          profile: (s as Record<string, unknown>).profiles as unknown as Profile,
        }))
      )
    }
  }

  const handleShare = async () => {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', trimmed)
      .single()

    if (!profile) {
      setError('User not found. They need to sign in first.')
      return
    }

    const { error: shareError } = await supabase
      .from('list_shares')
      .insert({ list_id: listId, shared_with_id: profile.id })

    if (shareError) {
      setError(shareError.code === '23505' ? 'Already shared with this user' : shareError.message)
      return
    }

    setEmail('')
    loadShares()
  }

  const handleRemove = async (shareId: string) => {
    await supabase.from('list_shares').delete().eq('id', shareId)
    loadShares()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share List</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleShare()}
            placeholder="Email address"
            className="flex-1"
          />
          <Button onClick={handleShare} size="icon">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        {shares.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Shared with</p>
            {shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm">{share.profile?.email ?? share.shared_with_id}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(share.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
