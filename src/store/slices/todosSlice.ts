import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase'
import type { Todo } from '@/types/database'

interface TodosState {
  items: Todo[]
  loading: boolean
  error: string | null
}

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchTodos = createAsyncThunk('todos/fetchTodos', async (listId: string) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as Todo[]
})

export const addTodo = createAsyncThunk(
  'todos/addTodo',
  async ({ listId, text }: { listId: string; text: string }) => {
    const { data, error } = await supabase
      .from('todos')
      .insert({ list_id: listId, text })
      .select()
      .single()
    if (error) throw error
    return data as Todo
  }
)

export const toggleTodo = createAsyncThunk(
  'todos/toggleTodo',
  async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
    const { data, error } = await supabase
      .from('todos')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Todo
  }
)

export const deleteTodo = createAsyncThunk('todos/deleteTodo', async (id: string) => {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw error
  return id
})

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    clearTodos(state) {
      state.items = []
    },
    optimisticToggle(state, action: PayloadAction<string>) {
      const todo = state.items.find((t) => t.id === action.payload)
      if (todo) {
        todo.is_completed = !todo.is_completed
        todo.completed_at = todo.is_completed ? new Date().toISOString() : null
      }
    },
    realtimeUpsert(state, action: PayloadAction<Todo>) {
      const index = state.items.findIndex((t) => t.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      } else {
        state.items.push(action.payload)
      }
    },
    realtimeDelete(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to fetch todos'
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        // Revert optimistic toggle on failure
        const id = action.meta.arg.id
        const todo = state.items.find((t) => t.id === id)
        if (todo) {
          todo.is_completed = !todo.is_completed
          todo.completed_at = todo.is_completed ? new Date().toISOString() : null
        }
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload)
      })
  },
})

export const { clearTodos, optimisticToggle, realtimeUpsert, realtimeDelete } = todosSlice.actions
export default todosSlice.reducer
