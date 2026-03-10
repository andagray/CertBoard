import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/portal']
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') return request.nextUrl.pathname === '/'
    return request.nextUrl.pathname.startsWith(path)
  })
  const isApiPath = request.nextUrl.pathname.startsWith('/api')

  // Allow public paths and API routes
  if (isPublicPath || isApiPath) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check subscription status for protected routes
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (profile) {
    const isTrialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
    const isSubscribed = profile.subscription_status === 'active'
    const isOnSubscribePage = request.nextUrl.pathname === '/subscribe'

    if (!isTrialActive && !isSubscribed && !isOnSubscribePage) {
      const url = request.nextUrl.clone()
      url.pathname = '/subscribe'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
