// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { logger } from './lib/utils';

// DEVELOPMENT SAFEGUARD: This middleware uses a hardcoded user for local development only.
// In production, it always uses the real Supabase session. Remove or disable the hardcoded user logic before deploying.
// See README for details.

export async function middleware(request: NextRequest) {
  // Prepare a mutable response that we can pass back later
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  /* ───────────────────────────────────────────────────────────────
   * Supabase client wired for the Edge runtime
   * ─────────────────────────────────────────────────────────────── */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options }),
          ),
      },
    },
  )

  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  logger.log('[COOKIE DEBUG]', {
    cookieName,
    cookieValue: request.cookies.get(cookieName)?.value?.slice(0, 80),
  });

  const { pathname } = request.nextUrl;

  // TEMP: Hardcode a user for local testing
  let user = null;
  if (process.env.NODE_ENV === 'development') {
    // DEV-ONLY: Simulate an admin user for local testing. Remove for production.
    user = {
      app_metadata: { role: 'app_att_admin' }
    };
  } else {
    // In production, use the real Supabase session
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  /* ───────────────────────────────────────────────────────────────
   * RBAC logic
   * ─────────────────────────────────────────────────────────────── */
  const protectedRoutes: Record<string, string[]> = {
    '/admin': ['app_att_admin'],
    '/dashboard': ['app_client_admin'],
    '/debug': ['app_att_admin', 'app_client_admin'],
  }

  const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
    pathname.startsWith(route),
  )

  // Debug logging
  if (isProtectedRoute) {
    const userRole = user?.app_metadata?.role
    const requiredRoles =
      Object.entries(protectedRoutes).find(([route]) =>
        pathname.startsWith(route),
      )?.[1] ?? []
    logger.log('[MIDDLEWARE DEBUG]', {
      pathname,
      user,
      userRole,
      requiredRoles,
    })
  }

  if (isProtectedRoute) {
    // not signed in → go home
    if (!user) return NextResponse.redirect(new URL('/', request.url))

    // signed in → does role match?
    const userRole = user.app_metadata?.role
    const requiredRoles =
      Object.entries(protectedRoutes).find(([route]) =>
        pathname.startsWith(route),
      )?.[1] ?? []

    if (!requiredRoles.includes(userRole))
      return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)'],
}
