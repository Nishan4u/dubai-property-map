import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  // Widened from plain `string` so a caller (e.g. document extraction)
  // can send a document/image content block alongside text. The
  // Anthropic SDK's own MessageParam.content is already typed
  // `string | Array<ContentBlockParam>`, and the mapping below was
  // already a direct passthrough -- this needed no other change to
  // runToolLoop itself. Every existing caller still passes a plain
  // string, so this is additive/non-breaking.
  content: string | Anthropic.ContentBlockParam[];
}

export type ToolDispatcher = (
  name: string,
  input: Record<string, unknown>
) => Promise<unknown>;

export function isAssistantEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_MAX_TURNS = 4;

/**
 * Generic tool-calling chat loop shared by every assistant in this app
 * (buyer, broker, salesperson): stream text deltas straight through,
 * collect the final message, dispatch any tool_use blocks via the
 * caller-supplied `dispatchTool`, feed results back, repeat up to
 * `maxTurns`. Callers own everything domain-specific -- the system
 * prompt, the tool schemas, what dispatchTool actually does (including
 * stashing side-channel data like matched projects via closure, since
 * this loop has no opinion on trailer markers or result shapes).
 */
export async function* runToolLoop({
  systemPrompt,
  tools,
  dispatchTool,
  history,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  maxTurns = DEFAULT_MAX_TURNS,
  onUsage,
}: {
  systemPrompt: string;
  tools: Anthropic.Tool[];
  dispatchTool: ToolDispatcher;
  history: ChatMessage[];
  model?: string;
  maxTokens?: number;
  maxTurns?: number;
  onUsage?: (usage: { model: string; inputTokens: number; outputTokens: number }) => void;
}): AsyncGenerator<string> {
  if (!isAssistantEnabled()) {
    yield "The AI assistant isn't set up yet -- please reach out through the site for help in the meantime.";
    return;
  }

  const client = getClient();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Summed across every turn (a request with tool calls makes several
  // Anthropic calls) so callers get one usage report per top-level
  // request, not one per turn.
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let turn = 0; turn < maxTurns; turn++) {
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }

    const final = await stream.finalMessage();
    messages.push({ role: "assistant", content: final.content });
    totalInputTokens += final.usage.input_tokens;
    totalOutputTokens += final.usage.output_tokens;

    if (final.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of final.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = await dispatchTool(block.name, (block.input ?? {}) as Record<string, unknown>);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "That lookup failed -- tell the user you're having trouble right now.",
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  onUsage?.({ model, inputTokens: totalInputTokens, outputTokens: totalOutputTokens });
}
