import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/auth-session';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|public|.*\\..*).*)',
  ],
}

export async function middleware(request: NextRequest) {
    console.log("Middleware running for:", request.nextUrl.pathname);   
  const { pathname } = request.nextUrl;
    const session = await getSession();
    if (!session) {
        if (pathname == '/login' || pathname == '/')
            return NextResponse.next();
        return NextResponse.redirect(new URL('/login', request.url));
    }
    else if (!session.verify2FA){
        if (pathname == '/2fa')
            return NextResponse.next();
        return NextResponse.redirect(new URL('/2fa', request.url));
    }
    else if (session.verify2FA && ['/2fa', '/', '/login'].includes(pathname))
        return NextResponse.redirect(new URL('/main', request.url));
    return NextResponse.next();
}