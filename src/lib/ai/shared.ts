// Constants shared between the server-side assistant (src/lib/ai/assistant.ts,
// which pulls in the Anthropic SDK and server-only Supabase client) and the
// client-side chat widget (src/components/public/AiChatWidget.tsx). Kept in
// its own file with zero server-only imports so the widget can import it
// without accidentally bundling server code into the client.
export const PROJECTS_TRAILER_MARKER = " PROJECTS ";
