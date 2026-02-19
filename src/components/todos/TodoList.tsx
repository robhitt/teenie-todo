import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { MoreHorizontal, Share2, Pencil, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  clearCompletedTodos,
  reorderTodos,
  optimisticToggle,
  optimisticReorder,
  clearTodos,
} from '@/store/slices/todosSlice'
import { renameList, deleteList } from '@/store/slices/listsSlice'
import { useSearch } from '@/hooks/useSearch'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShareListDialog } from '@/components/lists/ShareListDialog'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { useListMembers } from '@/hooks/useListMembers'
import { SearchBar } from './SearchBar'
import { TodoItem } from './TodoItem'
import { AddTodoInput } from './AddTodoInput'
import type { Todo } from '@/types/database'

function SortableTodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo
  onToggle: (id: string, isCompleted: boolean) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  )
}

export function TodoList() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items: todos, loading } = useAppSelector((state) => state.todos)
  const lists = useAppSelector((state) => state.lists.items)

  const currentList = lists.find((l) => l.id === listId)

  const [showCelebration, setShowCelebration] = useState(false)
  const prevActiveCount = useRef<number | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [showShare, setShowShare] = useState(false)

  const members = useListMembers(listId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  useRealtimeSubscription(listId)

  // Remember last opened list
  useEffect(() => {
    if (listId) {
      localStorage.setItem('lastListId', listId)
    }
  }, [listId])

  useEffect(() => {
    if (listId) {
      dispatch(fetchTodos(listId))
    }
    return () => {
      dispatch(clearTodos())
    }
  }, [dispatch, listId])

  const { query, setQuery, results } = useSearch(todos)

  const { active, completed } = useMemo(() => {
    const sorted = [...results].sort((a, b) => a.sort_order - b.sort_order)
    return {
      active: sorted.filter((t) => !t.is_completed),
      completed: sorted.filter((t) => t.is_completed),
    }
  }, [results])

  // Celebrate when all items are completed
  useEffect(() => {
    if (prevActiveCount.current !== null && prevActiveCount.current > 0 && active.length === 0 && completed.length > 0) {
      setShowCelebration(true)
      const duration = 1000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      setTimeout(() => setShowCelebration(false), 3000)
    }
    prevActiveCount.current = active.length
  }, [active.length, completed.length])

  const handleAdd = (text: string) => {
    if (listId) {
      dispatch(addTodo({ listId, text }))
    }
  }

  const handleToggle = (id: string, isCompleted: boolean) => {
    dispatch(optimisticToggle(id))
    dispatch(toggleTodo({ id, isCompleted }))
  }

  const handleDelete = (id: string) => {
    dispatch(deleteTodo(id))
    toast('Item deleted')
  }

  const handleEdit = (id: string, text: string) => {
    dispatch(updateTodo({ id, text }))
  }

  const handleClearCompleted = () => {
    if (listId) {
      dispatch(clearCompletedTodos(listId))
      toast('Completed items cleared')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (!over || dragActive.id === over.id) return

    const oldIndex = active.findIndex((t) => t.id === dragActive.id)
    const newIndex = active.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...active]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const newIds = reordered.map((t) => t.id)
    dispatch(optimisticReorder(newIds))

    const updates = newIds.map((id, index) => ({ id, sort_order: index }))
    dispatch(reorderTodos(updates))
  }

  const handleRename = async () => {
    const trimmed = renameName.trim()
    if (!trimmed || !listId) return
    await dispatch(renameList({ id: listId, name: trimmed }))
    setIsRenaming(false)
    toast('List renamed')
  }

  const handleDeleteList = async () => {
    if (!listId || !confirm('Delete this list and all its items?')) return
    await dispatch(deleteList(listId))
    toast('List deleted')
    navigate('/')
  }

  if (!listId) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
        Select a list or create a new one
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="mb-4 h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mb-4 h-9 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex h-full max-w-2xl flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        {isRenaming ? (
          <form onSubmit={(e) => { e.preventDefault(); handleRename() }} className="flex flex-1 gap-2">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              autoFocus
              className="text-2xl font-bold"
            />
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsRenaming(false)}>Cancel</Button>
          </form>
        ) : (
          <>
            <h1 className="flex-1 text-2xl font-bold">{currentList?.name ?? 'List'}</h1>
            {members.length > 1 && <AvatarStack members={members} />}
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowMenu(!showMenu)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border bg-popover py-1 shadow-md">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent min-h-[44px]"
                    onClick={() => { setShowShare(true); setShowMenu(false) }}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent min-h-[44px]"
                    onClick={() => { setRenameName(currentList?.name ?? ''); setIsRenaming(true); setShowMenu(false) }}
                  >
                    <Pencil className="h-4 w-4" /> Rename
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-accent min-h-[44px]"
                    onClick={() => { handleDeleteList(); setShowMenu(false) }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete List
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {listId && <ShareListDialog listId={listId} isOpen={showShare} onClose={() => setShowShare(false)} />}

      <SearchBar value={query} onChange={setQuery} />

      <div className="mt-4 flex-1 overflow-auto">
        {active.length > 0 && (
          <div className="mb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={active.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {active.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            {active.length > 0 && (
              <div className="mb-2 flex items-center gap-2 border-t pt-2">
                <span className="flex-1 text-xs font-medium text-muted-foreground">
                  Completed ({completed.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={handleClearCompleted}
                >
                  Clear
                </Button>
              </div>
            )}
            {completed.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {showCelebration && active.length === 0 && completed.length > 0 && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-center">
            <p className="text-lg font-semibold text-green-800">All done!</p>
            <p className="text-sm text-green-600">Every item on this list is complete</p>
          </div>
        )}

        {active.length === 0 && completed.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            {query ? 'No items match your search' : 'No items yet. Add one below!'}
          </div>
        )}
      </div>

      {!query && (
        <div className="border-t pt-4">
          <AddTodoInput onAdd={handleAdd} />
        </div>
      )}
    </div>
  )
}
