import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/auth-session';
import path from 'path';

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|api|public|.*\\..*).*)',
//   ],
// }

// export async function proxy(request: NextRequest) {
//     const { pathname } = request.nextUrl;
//     const session = await getSession();
//     if (!session) {
//         if (pathname === '/login' || pathname === '/' || pathname ==='/register') 
//             return NextResponse.next();
//         return NextResponse.redirect(new URL('/login', request.url));
//     }
//     else if (!session.verify2FA){
//         if (pathname === '/2fa'){
//             return NextResponse.next();
//         }
//         return NextResponse.redirect(new URL('/2fa', request.url));
//     }
//     else if (session.verify2FA && ['/2fa', '/', '/login'].includes(pathname))
//         return NextResponse.redirect(new URL('/main', request.url));
//     return NextResponse.next();
// }

const PUBLIC_PATHS = ['/login', '/', '/register'];
const AUTH_API_PREFIX = '/api/auth/';
const TWO_FA_PATH = '/2fa';
const TWO_FA_API_PREFIX = '/api/2fa/';
const LOGOUT_API = '/api/auth/logout';
const DEFAULT_REDIRECT_AFTER_LOGIN = '/main';

export const config = {
  matcher: [
    // '/((?!_next/static|_next/image|favicon.ico|api|public|.*\\..*).*)',
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
  ],
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = await getSession();
    if (!session) {
        const isPublicPage = PUBLIC_PATHS.includes(pathname);
        const isAuthApi = pathname.startsWith(AUTH_API_PREFIX);
        if (isPublicPage || isAuthApi) 
            return NextResponse.next();
        return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!session.verify2FA){
        const is2FAPath = pathname === TWO_FA_PATH || pathname.startsWith(TWO_FA_API_PREFIX);
        const isLogout = pathname === LOGOUT_API;
        if (is2FAPath || isLogout)
            return NextResponse.next();
        return NextResponse.redirect(new URL(TWO_FA_PATH, request.url));
    }
    if (session.verify2FA && [...PUBLIC_PATHS, TWO_FA_PATH].includes(pathname))
        return NextResponse.redirect(new URL('/main', request.url));
    return NextResponse.next();
}
