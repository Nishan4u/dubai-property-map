// Constants shared between the server-side assistants (src/lib/ai/*.ts,
// which pull in the Anthropic SDK and server-only Supabase client) and the
// client-side chat widgets (src/components/public/AiChatWidget.tsx,
// src/components/portal/PortalAssistantWidget.tsx). Kept in its own file
// with zero server-only imports so the widgets can import it without
// accidentally bundling server code into the client.
export const PROJECTS_TRAILER_MARKER = " PROJECTS ";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

// Same request-body validation used by every /api/**/assistant/chat route
// (public, broker, salesperson) -- kept here so it's written once.
export function isValidMessages(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_MESSAGES &&
    value.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0 &&
        m.content.length <= MAX_MESSAGE_LENGTH
    )
  );
}
