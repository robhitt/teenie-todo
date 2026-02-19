import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store/hooks'
import { createList } from '@/store/slices/listsSlice'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CreateListPage() {
  const [name, setName] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const result = await dispatch(createList(trimmed))
    if (createList.fulfilled.match(result)) {
      toast('List created')
      navigate(`/list/${result.payload.id}`)
    } else {
      toast.error('Failed to create list')
    }
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">New List</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name (e.g., Groceries)"
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={!name.trim()}>
            Create List
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
