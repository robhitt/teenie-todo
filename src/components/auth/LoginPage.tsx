import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'

interface LoginPageProps {
  redirectTo?: string
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo ?? window.location.origin,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Teenie ToDo</h1>
          <p className="mt-2 text-muted-foreground">
            A simple, shared todo list with search
          </p>
        </div>
        <Button onClick={handleGoogleLogin} size="lg" className="w-full">
          <LogIn className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
