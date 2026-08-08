import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// extraRequestHeaders lets callers (proxy.ts) forward computed values --
// e.g. whether this path should suppress ads -- into the request headers
// Server Components read via next/headers' headers(). Cloning into a new
// Headers instance and passing it through NextResponse.next({ request:
// { headers } }) at every call site (rather than mutating request.headers
// in place) is the pattern Next.js's own proxy docs use.
export async function updateSession(
  request: NextRequest,
  extraRequestHeaders?: Record<string, string>
) {
  const requestHeaders = new Headers(request.headers);
  for (const [key, value] of Object.entries(extraRequestHeaders ?? {})) {
    requestHeaders.set(key, value);
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token if expired — required for Server Components,
  // which cannot write cookies themselves.
  await supabase.auth.getUser();

  return response;
}
