'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email:    z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError('E-Mail oder Passwort ist falsch. Bitte versuche es erneut.')
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-ef-main flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-md border border-ef-border p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-ef-green rounded-xl flex items-center justify-center mb-3">
              <span className="text-white text-lg font-bold">EF</span>
            </div>
            <p className="text-[13px] font-semibold text-ef-text">Effective Football</p>
            <p className="text-xs text-ef-muted">Management App</p>
          </div>

          <h1 className="text-xl font-bold text-ef-text text-center mb-1">Willkommen zurück</h1>
          <p className="text-sm text-ef-muted text-center mb-6">
            Melde dich mit deinem Admin-Account an
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-ef-text mb-1.5">
                E-Mail-Adresse
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@effective.football"
                className="w-full h-9 px-3 text-sm border border-ef-border rounded-md focus:outline-none focus:ring-2 focus:ring-ef-green focus:border-transparent transition-shadow"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-ef-text mb-1.5">
                Passwort
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-9 px-3 pr-9 text-sm border border-ef-border rounded-md focus:outline-none focus:ring-2 focus:ring-ef-green focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ef-muted mt-4">
          Effective Football © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
