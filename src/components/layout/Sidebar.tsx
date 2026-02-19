import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, LogOut, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchLists } from '@/store/slices/listsSlice'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onNavigate: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const dispatch = useAppDispatch()
  const lists = useAppSelector((state) => state.lists.items)
  const listsLoading = useAppSelector((state) => state.lists.loading)
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    dispatch(fetchLists())
  }, [dispatch])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="hidden md:flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Teenie ToDo</h2>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        {listsLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No lists yet. Create one below!
          </div>
        ) : (
          lists.map((list) => (
            <NavLink
              key={list.id}
              to={`/list/${list.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent min-h-[44px] flex items-center gap-2',
                  isActive && 'bg-accent font-medium'
                )
              }
            >
              <span className="flex-1 truncate">{list.name}</span>
              {list.owner_id !== user?.id && (
                <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </NavLink>
          ))
        )}
      </nav>

      <div className="border-t p-2">
        <NavLink
          to="/new-list"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          New List
        </NavLink>

        <div className="mt-2 flex items-center justify-between px-3 py-1">
          {user && (
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-8 w-8 shrink-0 md:hidden"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
