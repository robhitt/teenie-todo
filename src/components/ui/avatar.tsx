import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface AvatarProps {
  profile: Profile
  size?: 'sm' | 'md'
  className?: string
}

function getInitials(profile: Profile): string {
  if (profile.display_name) {
    return profile.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (profile.email) {
    return profile.email[0].toUpperCase()
  }
  return '?'
}

const colors = [
  'bg-red-200 text-red-800',
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-yellow-200 text-yellow-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-indigo-200 text-indigo-800',
  'bg-orange-200 text-orange-800',
]

function getColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ profile, size = 'md', className }: AvatarProps) {
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.display_name ?? profile.email ?? ''}
        referrerPolicy="no-referrer"
        className={cn('rounded-full object-cover ring-2 ring-background', sizeClass, className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium ring-2 ring-background',
        sizeClass,
        getColor(profile.id),
        className
      )}
      title={profile.display_name ?? profile.email ?? undefined}
    >
      {getInitials(profile)}
    </div>
  )
}
