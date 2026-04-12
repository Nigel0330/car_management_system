import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // If not logged in, redirect to login
  if (!user) {
    if (pathname.startsWith('/login')) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Get user role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = userData?.role

  // Redirect logged in user away from login page
  if (pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    if (role === 'owner') url.pathname = '/admin'
    else if (role === 'manager') url.pathname = '/manager'
    else url.pathname = '/staff'
    return NextResponse.redirect(url)
  }

  // Protect /admin routes — owner only
  if (pathname.startsWith('/admin') && role !== 'owner') {
    const url = request.nextUrl.clone()
    if (role === 'manager') url.pathname = '/manager'
    else url.pathname = '/staff'
    return NextResponse.redirect(url)
  }

  // Protect /manager routes — manager only
  if (pathname.startsWith('/manager') && role !== 'manager') {
    const url = request.nextUrl.clone()
    if (role === 'owner') url.pathname = '/admin'
    else url.pathname = '/staff'
    return NextResponse.redirect(url)
  }

  // Protect /staff routes — staff only
  if (pathname.startsWith('/staff') && role !== 'staff') {
    const url = request.nextUrl.clone()
    if (role === 'owner') url.pathname = '/admin'
    else url.pathname = '/manager'
    return NextResponse.redirect(url)
  }

  // Redirect root to correct dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    if (role === 'owner') url.pathname = '/admin'
    else if (role === 'manager') url.pathname = '/manager'
    else url.pathname = '/staff'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}