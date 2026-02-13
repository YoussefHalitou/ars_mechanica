import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedPaths = ['/dashboard', '/mitarbeiter', '/projekte', '/zeiterfassung', '/planning']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check for access token in cookies
    const token = request.cookies.get('has_session')?.value
    const isProtected = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(path + '/')
    )

    // 1. If at root URL, check token
    if (pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/planning', request.url))
        } else {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 2. If at Login, redirect if already logged in
    if (pathname === '/login') {
        if (token) {
            return NextResponse.redirect(new URL('/planning', request.url))
        }
        return NextResponse.next()
    }

    // 3. Protected routes: Redirect to Login if no token
    if (isProtected) {
        if (!token) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/mitarbeiter/:path*', '/projekte/:path*', '/zeiterfassung/:path*', '/planning/:path*', '/login', '/'],
}
