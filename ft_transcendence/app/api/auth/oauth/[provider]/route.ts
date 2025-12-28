import { NextResponse } from "next/server";
import crypto from 'crypto';
import { 
  OAuthConfig,
  GoogleAuthConfig,
  GitHubAuthConfig,
  School42AuthConfig
} from "@/lib/auth/auth-config";

export const AUTH_CONFIGS: Record<string, OAuthConfig> = {
    google: GoogleAuthConfig,
    github: GitHubAuthConfig,
    "42": School42AuthConfig,
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const config = AUTH_CONFIGS[provider as keyof typeof AUTH_CONFIGS];

    // ตรวจสอบว่า Provider ที่เรียกมามีรองรับหรือไม่
    if (!config) {
      return NextResponse.redirect(new URL("/login?error=unsupported_provider", req.url));
    }

    // สร้าง Secure State
    const state = crypto.randomBytes(32).toString('hex');
    
    // สร้าง Query Parameters
    const queryParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state: state,
      ...config.additionalParams,
    });

    const targetUrl = `${config.authUrl}?${queryParams.toString()}`;
    const response = NextResponse.redirect(targetUrl);

    // ฝัง State ลงใน Cookie อย่างปลอดภัย
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("OAuth Init Error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { setUserId } from "@/lib/auth";
// import crypto from 'crypto';

// // Mocked email addresses for each OAuth provider
// const PROVIDER_TO_EMAIL: Record<string, string> = {
//   google: "mobile@example.com",
//   github: "ohm@example.com",
//   "42": "palm@example.com",
// };

// export async function GET(
//   _req: Request,
//   { params }: { params: Promise<{ provider: string }> }
// ) {
//   const { provider } = await params;
//   let rootUrl: string;
//   let options: Record<string, string>;
//   const state = crypto.randomBytes(32).toString('hex');
//   if (provider === 'google') {
//     rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
//     options = {
//       redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
//       client_id: process.env.GOOGLE_CLIENT_ID!,
//       access_type: "offline",
//       response_type: "code",
//       prompt: "consent",
//       scope: "openid email profile",
//       state,
//     };
    
//   }
//   else if (provider === '42') {
//     rootUrl = "https://api.intra.42.fr/oauth/authorize";
//     options = {
//       client_id: process.env.FTBK_CLIENT_ID!,
//       redirect_uri: process.env.FTBK_REDIRECT_URI!,
//       response_type: "code",
//       state,
//     };
//   }
//   else {
//     rootUrl = "https://github.com/login/oauth/authorize";
//     options = {
//       redirect_uri: process.env.GITHUB_REDIRECT_URI!,
//       client_id: process.env.GITHUB_CLIENT_ID!,
//       scope: "user:email",
//       state,
//     };
//   }
  
//   const qs = new URLSearchParams(options);
//   const response = NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
//   // Set cookie
//   response.cookies.set('oauth_state', state, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax', 
//     maxAge: 60 * 10,
//   });

//   return response;

//   // const email = PROVIDER_TO_EMAIL[provider];

//   // if (!email) {
//   //   return NextResponse.redirect(new URL("/login?error=unknown_provider", _req.url));
//   // }

//   // const user = await prisma.user.findUnique({ where: { email } });
//   // if (!user) {
//   //   return NextResponse.redirect(new URL("/login?error=user_not_seeded", _req.url));
//   // }

//   // await setUserId(String(user.id));
//   // return NextResponse.redirect(new URL("/main", _req.url));
// }
