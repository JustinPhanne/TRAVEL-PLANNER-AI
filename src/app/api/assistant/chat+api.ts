import type { GenerateContentResponse } from "@google/genai";
import type { Span } from "@sentry/react-native";
import { z } from "zod";

import { addMessage } from "@/db/assistant-messages";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { GEMINI_MODEL, gemini } from "@/lib/gemini";
import { Sentry } from "@/lib/sentry";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1),
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(chatMessageSchema).max(20).default([]),
});

const MAX_ATTEMPTS = 3;
const AGENT_NAME = "Travel Assistant";

function isRetryableGeminiError(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  return status === 503 || status === 429;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function markSpanFailed(span: Span, err: unknown) {
  span.setStatus({ code: 2, message: "internal_error" });
  span.setAttribute(
    "error.type",
    err instanceof Error ? err.constructor.name : "Error",
  );
  span.end();
}

const SYSTEM_INSTRUCTION = [
  "You are Triply's in-app travel assistant.",
  "Help the traveler with destination ideas, timing, packing, budgeting, and itinerary questions.",
  "Answer conversationally in a few short paragraphs or a bullet list — no markdown headers or bold text.",
  "Keep answers focused and skimmable on a phone screen.",
  "If a question has nothing to do with travel, gently steer the conversation back to travel planning.",
].join(" ");

export async function POST(request: Request) {
  return Sentry.startSpan(
    { op: "http.server", name: "POST /api/assistant/chat" },
    async () => {
      let userId: string;
      try {
        userId = await requireUserId(request);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          return Response.json({ error: err.message }, { status: 401 });
        }
        throw err;
      }

      const body = await request.json().catch(() => null);
      const parsed = chatRequestSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Invalid request", issues: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const { message, history } = parsed.data;

      await addMessage({ userId, role: "user", text: message });

      // gen_ai.* message format: {role, parts:[{type, content}]} — see
      // https://docs.sentry.io/platforms/react-native/agent-tracing/
      const inputMessages = [
        ...history.map((m) => ({
          role: m.role,
          parts: [{ type: "text", content: m.text }],
        })),
        { role: "user", parts: [{ type: "text", content: message }] },
      ];
      const contents = inputMessages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: m.parts.map((p) => ({ text: p.content })),
      }));

      // Agent Tracing hierarchy: gen_ai.invoke_agent is the container span,
      // gen_ai.chat is its child. Both are started inactive (rather than via
      // startSpan's callback form) because they must stay open across the
      // streamed response, which continues after this handler returns the
      // Response object.
      const agentSpan = Sentry.startInactiveSpan({
        op: "gen_ai.invoke_agent",
        name: `invoke_agent ${AGENT_NAME}`,
        attributes: {
          "gen_ai.operation.name": "invoke_agent",
          "gen_ai.agent.name": AGENT_NAME,
          "gen_ai.provider.name": "google",
          "gen_ai.request.model": GEMINI_MODEL,
          "gen_ai.system_instructions": SYSTEM_INSTRUCTION,
          "gen_ai.input.messages": JSON.stringify(inputMessages),
        },
      });

      const chatSpan = Sentry.withActiveSpan(agentSpan, () =>
        Sentry.startInactiveSpan({
          op: "gen_ai.chat",
          name: `chat ${GEMINI_MODEL}`,
          attributes: {
            "gen_ai.operation.name": "chat",
            "gen_ai.provider.name": "google",
            "gen_ai.request.model": GEMINI_MODEL,
            "gen_ai.agent.name": AGENT_NAME,
            "gen_ai.system_instructions": SYSTEM_INSTRUCTION,
            "gen_ai.input.messages": JSON.stringify(inputMessages),
          },
        }),
      );

      const requestStartedAt = Date.now();
      let stream: AsyncGenerator<GenerateContentResponse> | undefined;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          stream = await Sentry.withActiveSpan(chatSpan, () =>
            gemini.models.generateContentStream({
              model: GEMINI_MODEL,
              contents,
              config: { systemInstruction: SYSTEM_INSTRUCTION },
            }),
          );
          break;
        } catch (err) {
          const isLastAttempt = attempt === MAX_ATTEMPTS;
          if (!isRetryableGeminiError(err) || isLastAttempt) {
            Sentry.logger.error(
              Sentry.logger.fmt`Assistant chat request failed to start: ${err}`,
              { user_id: userId },
            );
            markSpanFailed(chatSpan, err);
            markSpanFailed(agentSpan, err);
            const message = isRetryableGeminiError(err)
              ? "The assistant is getting a lot of requests right now. Please try again in a moment."
              : "The assistant is having trouble right now. Please try again.";
            return Response.json({ error: message }, { status: 502 });
          }
          Sentry.logger.warn("Gemini overloaded, retrying chat request", {
            user_id: userId,
            attempt,
          });
          await sleep(400 * attempt);
        }
      }

      const activeStream = stream as AsyncGenerator<GenerateContentResponse>;
      const encoder = new TextEncoder();

      const responseStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          let text = "";
          let inputTokens = 0;
          let outputTokens = 0;
          let cachedInputTokens = 0;
          let reasoningOutputTokens = 0;
          let totalTokens = 0;
          let responseModel: string = GEMINI_MODEL;
          let finishReason: string | undefined;
          let firstChunkAt: number | null = null;

          try {
            for await (const chunk of activeStream) {
              if (firstChunkAt === null) {
                firstChunkAt = Date.now();
                chatSpan.setAttribute(
                  "gen_ai.response.time_to_first_chunk",
                  (firstChunkAt - requestStartedAt) / 1000,
                );
              }
              if (chunk.text) {
                text += chunk.text;
                controller.enqueue(encoder.encode(chunk.text));
              }
              if (chunk.modelVersion) responseModel = chunk.modelVersion;
              const candidateFinishReason = chunk.candidates?.[0]?.finishReason;
              if (candidateFinishReason) finishReason = candidateFinishReason;
              if (chunk.usageMetadata) {
                inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
                outputTokens =
                  chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
                cachedInputTokens =
                  chunk.usageMetadata.cachedContentTokenCount ?? cachedInputTokens;
                reasoningOutputTokens =
                  chunk.usageMetadata.thoughtsTokenCount ?? reasoningOutputTokens;
                totalTokens = chunk.usageMetadata.totalTokenCount ?? totalTokens;
              }
            }

            const outputMessages = [
              { role: "assistant", parts: [{ type: "text", content: text }] },
            ];

            for (const span of [chatSpan, agentSpan]) {
              span.setAttribute("gen_ai.response.model", responseModel);
              span.setAttribute("gen_ai.response.streaming", true);
              span.setAttribute(
                "gen_ai.output.messages",
                JSON.stringify(outputMessages),
              );
              if (finishReason) {
                span.setAttribute(
                  "gen_ai.response.finish_reasons",
                  JSON.stringify([finishReason]),
                );
              }
              span.setAttribute("gen_ai.usage.input_tokens", inputTokens);
              span.setAttribute("gen_ai.usage.output_tokens", outputTokens);
              if (cachedInputTokens > 0) {
                span.setAttribute(
                  "gen_ai.usage.cache_read.input_tokens",
                  cachedInputTokens,
                );
              }
              if (reasoningOutputTokens > 0) {
                span.setAttribute(
                  "gen_ai.usage.reasoning.output_tokens",
                  reasoningOutputTokens,
                );
              }
              if (totalTokens > 0) {
                span.setAttribute("gen_ai.usage.total_tokens", totalTokens);
              }
              span.end();
            }

            Sentry.logger.info("Assistant chat streamed", {
              user_id: userId,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
            });

            if (text.length > 0) {
              await addMessage({ userId, role: "assistant", text });
            }
          } catch (err) {
            Sentry.logger.error(
              Sentry.logger.fmt`Assistant chat stream failed mid-response: ${err}`,
              { user_id: userId },
            );
            markSpanFailed(chatSpan, err);
            markSpanFailed(agentSpan, err);
            if (text.length > 0) {
              await addMessage({ userId, role: "assistant", text });
            }
            controller.error(err);
            return;
          }
          controller.close();
        },
      });

      return new Response(responseStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    },
  );
}
