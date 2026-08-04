import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { getPublicApiDevelopers } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  return withApiAuth(request, "developers:read", "/api/v1/developers", async () => {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 100;
    return { data: await getPublicApiDevelopers(limit) };
  });
}
