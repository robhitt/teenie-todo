import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { store } from '@/store/store'
import { useAppSelector } from '@/store/hooks'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppLayout } from '@/components/layout/AppLayout'
import { TodoList } from '@/components/todos/TodoList'
import { CreateListPage } from '@/components/lists/CreateListDialog'
import { InviteHandler } from '@/components/invite/InviteHandler'

function HomeRedirect() {
  const navigate = useNavigate()
  const lists = useAppSelector((state) => state.lists.items)
  const loading = useAppSelector((state) => state.lists.loading)

  useEffect(() => {
    if (loading) return
    const lastListId = localStorage.getItem('lastListId')
    if (lastListId && lists.some((l) => l.id === lastListId)) {
      navigate(`/list/${lastListId}`, { replace: true })
    }
  }, [lists, loading, navigate])

  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Select a list or create a new one
    </div>
  )
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="invite/:token" element={<InviteHandler />} />
          <Route
            path="*"
            element={
              <AuthGuard>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route index element={<HomeRedirect />} />
                    <Route path="list/:listId" element={<TodoList />} />
                    <Route path="new-list" element={<CreateListPage />} />
                  </Route>
                </Routes>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-center" />
    </Provider>
  )
}

export default App
