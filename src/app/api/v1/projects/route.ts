import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { getPublicApiProjects } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  return withApiAuth(request, "projects:read", "/api/v1/projects", async () => {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 50;
    return { data: await getPublicApiProjects(limit) };
  });
}
