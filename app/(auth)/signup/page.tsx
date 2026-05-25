'use client'

import { useState } from 'react'
import { signUp } from '@/actions/auth'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setInfo(null)
    const result = await signUp(formData)
    if (result && 'error' in result) {
      setError(result.error)
      setLoading(false)
    } else if (result && 'info' in result) {
      setInfo(result.info)
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
          <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {info && (
          <p role="status" className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {info}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            placeholder="Min 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

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
