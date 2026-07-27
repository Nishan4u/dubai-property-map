// Supabase's JS client doesn't always surface a usable string on `error.message`
// (e.g. some 500 responses resolve to a message that stringifies to "{}") —
// this guards every auth form against rendering that raw, meaningless text.
export function authErrorMessage(error: { message?: unknown } | null | undefined, fallback = "Something went wrong — please try again.") {
  return typeof error?.message === "string" && error.message.trim() ? error.message : fallback;
}
