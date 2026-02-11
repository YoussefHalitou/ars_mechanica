import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedPaths = ['/dashboard', '/mitarbeiter', '/projekte', '/zeiterfassung']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if the path is protected
    const isProtected = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(path + '/')
    )

    if (!isProtected) {
        return NextResponse.next()
    }

    // Check for access token in cookies or localStorage isn't available in middleware,
    // so we check a cookie that we'll set on login
    const token = request.cookies.get('has_session')?.value

    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/mitarbeiter/:path*', '/projekte/:path*', '/zeiterfassung/:path*'],
}
