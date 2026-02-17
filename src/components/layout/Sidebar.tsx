import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchLists } from '@/store/slices/listsSlice'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const dispatch = useAppDispatch()
  const lists = useAppSelector((state) => state.lists.items)
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    dispatch(fetchLists())
  }, [dispatch])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Better ToDo</h2>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        {lists.map((list) => (
          <NavLink
            key={list.id}
            to={`/list/${list.id}`}
            className={({ isActive }) =>
              cn(
                'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                isActive && 'bg-accent font-medium'
              )
            }
          >
            {list.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2">
        <NavLink
          to="/new-list"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          New List
        </NavLink>
        {user && (
          <div className="mt-2 truncate px-3 py-1 text-xs text-muted-foreground">
            {user.email}
          </div>
        )}
      </div>
    </div>
  )
}
