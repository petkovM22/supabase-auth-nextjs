import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Logged in as <span className="font-medium text-black">{user?.email}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full border rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  )
}
