import { redirect } from 'next/navigation'

// Root redirects to /dashboard; middleware will redirect unauthenticated
// users to /login automatically.
export default function RootPage() {
  redirect('/dashboard')
}
