import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { getPublicApiCommunities } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  return withApiAuth(request, "communities:read", "/api/v1/communities", async () => {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 100;
    return { data: await getPublicApiCommunities(limit) };
  });
}
