import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          const cookieOptions =
            typeof options === "object" && options !== null ? options : {};
          req.cookies.set({
            name,
            value,
            ...(cookieOptions as object),
          });
          response = NextResponse.next({ request: req });
          response.cookies.set({
            name,
            value,
            ...(cookieOptions as object),
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          const cookieOptions =
            typeof options === "object" && options !== null ? options : {};
          req.cookies.set({
            name,
            value: "",
            ...(cookieOptions as object),
          });
          response = NextResponse.next({ request: req });
          response.cookies.set({
            name,
            value: "",
            ...(cookieOptions as object),
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/lecture");

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/lecture/:path*"],
};
