import { Avatar } from './avatar'
import type { Profile } from '@/types/database'

interface AvatarStackProps {
  members: Profile[]
  max?: number
}

export function AvatarStack({ members, max = 5 }: AvatarStackProps) {
  const visible = members.slice(0, max)
  const overflow = members.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((member) => (
        <Avatar key={member.id} profile={member} size="sm" />
      ))}
      {overflow > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
          +{overflow}
        </div>
      )}
    </div>
  )
}
