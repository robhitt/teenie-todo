import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { UserPlus, X, Link2, Check } from 'lucide-react'
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

interface ActiveLink {
  id: string
  token: string
  expires_at: string
  created_at: string
}

function InviteLinkSection({ listId, links, onLinksChange }: { listId: string; links: ActiveLink[]; onLinksChange: () => void }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopyLink = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invite_links')
        .insert({ list_id: listId, created_by: user.id })
        .select('token')
        .single()

      if (error) {
        toast.error('Failed to create invite link')
        return
      }

      const url = `${window.location.origin}/invite/${data.token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast('Invite link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
      onLinksChange()
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (linkId: string) => {
    await supabase.from('invite_links').delete().eq('id', linkId)
    toast('Invite link revoked')
    onLinksChange()
  }

  const handleRevokeAll = async () => {
    await supabase.from('invite_links').delete().eq('list_id', listId)
    toast('All invite links revoked')
    onLinksChange()
  }

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleCopyLink}
        disabled={loading}
      >
        {copied ? (
          <><Check className="mr-2 h-4 w-4" /> Copied!</>
        ) : (
          <><Link2 className="mr-2 h-4 w-4" /> Copy invite link</>
        )}
      </Button>
      <p className="mt-1 text-xs text-muted-foreground">Single-use link. Expires in 7 days.</p>

      {links.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Active links ({links.length})</p>
            {links.length > 1 && (
              <button className="text-xs text-destructive hover:underline" onClick={handleRevokeAll}>
                Revoke all
              </button>
            )}
          </div>
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5">
              <span className="truncate font-mono text-xs text-muted-foreground">
                ...{link.token.slice(-8)}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRevoke(link.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ShareListDialog({ listId, isOpen, onClose }: ShareListDialogProps) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState<ShareEntry[]>([])
  const [inviteLinks, setInviteLinks] = useState<ActiveLink[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadShares()
      loadInviteLinks()
    }
  }, [isOpen, listId])

  const loadInviteLinks = async () => {
    const { data } = await supabase
      .from('invite_links')
      .select('id, token, expires_at, created_at')
      .eq('list_id', listId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    setInviteLinks(data ?? [])
  }

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
    toast('List shared successfully')
    loadShares()
  }

  const handleRemove = async (shareId: string) => {
    await supabase.from('list_shares').delete().eq('id', shareId)
    toast('User removed from list')
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

        <InviteLinkSection listId={listId} links={inviteLinks} onLinksChange={loadInviteLinks} />

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
