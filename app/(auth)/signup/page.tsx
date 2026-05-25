'use client'

import { useState } from 'react'
import { signUp } from '@/actions/auth'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        action={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold">Create account</h1>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          name="password"
          type="password"
          placeholder="Password (min 6 characters)"
          required
          minLength={6}
          autoComplete="new-password"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-sm text-center text-gray-600">
          Have an account?{' '}
          <a href="/login" className="underline text-black">
            Log in
          </a>
        </p>
      </form>
    </main>
  )
}
