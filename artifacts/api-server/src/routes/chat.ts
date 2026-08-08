/**
 * AI Chat Route — Gemini
 *
 * Uses Gemini API with gemini-3.6-flash model.
 * Specialized for Philippine agriculture assistance only.
 * Conversation history stored in Postgres via Drizzle ORM.
 */

import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db, conversations, messages } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "mock-api-key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
const MODEL = "gemini-2.5-flash"; // Using the latest free Gemini model

function buildSystemPrompt(ctx: {
  cityName?: string;
  provinceName?: string;
  regionName?: string;
  regionCode?: string;
  provinceCode?: string;
  cityCode?: string;
  preferredCrops?: string[];
  weather?: { temperature?: number; condition?: string; humidity?: number } | null;
}): string {
  const location = [ctx.cityName, ctx.provinceName, ctx.regionName, "Philippines"]
    .filter(Boolean)
    .join(", ") || "Philippines";
  const crops =
    ctx.preferredCrops && ctx.preferredCrops.length > 0
      ? ctx.preferredCrops.join(", ")
      : "general crops";
  const weatherInfo = ctx.weather
    ? `Current weather: ${ctx.weather.temperature ?? "?"}°C, ${ctx.weather.condition ?? "unknown"}, Humidity: ${ctx.weather.humidity ?? "?"}%`
    : "";

  return `You are Grownox, an expert agricultural advisor exclusively for Filipino farmers.

FARMER PROFILE:
- Location: ${location}
  - Region Code: ${ctx.regionCode || "—"}
  - Province Code: ${ctx.provinceCode || "—"}
  - City/Municipality Code: ${ctx.cityCode || "—"}
- Primary Crops: ${crops}
${weatherInfo ? `- ${weatherInfo}` : ""}

YOUR ROLE:
You provide expert, practical agriculture guidance ONLY. You specialize in:
1. Crop advice (planting, care, variety selection for the farmer's PSGC location and climate)
2. Pest and disease diagnosis (identification, treatment, prevention)
3. Fertilizer scheduling (nutrient management, timing, rates)
4. Irrigation guidance (scheduling, water management, ET-based advice)
5. Weather interpretation (how current/forecasted weather affects crops)
6. Farm planning (season planning, crop rotation, intercropping)
7. Market explanation (price trends, when to sell, commodity insights)

STRICT RULES:
- ONLY answer questions about agriculture, farming, crops, soil, weather for farming, pests, fertilizers, and market prices.
- If asked about ANYTHING unrelated to agriculture, politely decline and steer the conversation back to agriculture, farming, crops, etc. (e.g. "I'm Grownox, specialized for agricultural guidance only. Please ask me about your crops, farming practices, pests, fertilizers, weather, or market prices.")
- Always tailor advice to the farmer's specific PSGC location (${location}).
- Always consider the farmer's crop profile (${crops}) when giving advice.
- Give concise, practical, actionable answers in clear language.
- Use Filipino farming context (Philippine climate, wet/dry seasons, typhoon risks, local pests).
- Format with bullet points and numbered steps when listing tasks.
- Do not hallucinate — if unsure, say so and recommend consulting a local agronomist.

Respond in English. Be practical and concise.`;
}

/** GET /api/chat/status */
router.get("/chat/status", (_req, res) => {
  const ready = !!process.env.GEMINI_API_KEY;
  res.json({ ready, model: MODEL, provider: "google" });
});

/** GET /api/chat/conversations */
router.get("/chat/conversations", async (_req, res) => {
  try {
    const convs = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt))
      .limit(50);
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/** POST /api/chat/conversations */
router.post("/chat/conversations", async (req, res) => {
  const { title = "New Chat" } = req.body ?? {};
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/** DELETE /api/chat/conversations/:id */
router.delete("/chat/conversations/:id", async (req, res) => {
  try {
    await db.delete(conversations).where(eq(conversations.id, parseInt(req.params.id, 10)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/** GET /api/chat/conversations/:id/messages */
router.get("/chat/conversations/:id/messages", async (req, res) => {
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parseInt(req.params.id, 10)))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/** POST /api/chat/conversations/:id/messages — SSE streaming via Gemini */
router.post("/chat/conversations/:id/messages", async (req, res) => {
  const conversationId = parseInt(req.params.id, 10);

  const { content, context } = req.body as {
    content?: string;
    context?: {
      cityName?: string;
      provinceName?: string;
      regionName?: string;
      regionCode?: string;
      provinceCode?: string;
      cityCode?: string;
      preferredCrops?: string[];
      weather?: { temperature?: number; condition?: string; humidity?: number } | null;
    };
  };

  if (!content?.trim()) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  try {
    // Save user message
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: content.trim(),
    });

    // Load conversation history (last 20 messages for context window)
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(20);

    const systemPrompt = buildSystemPrompt(context ?? {});

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(0, -1).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: content.trim() },
    ];
    
    // Using `generateContentStream` with `systemInstruction` in `config`
    const chatConfig = {
      systemInstruction: systemPrompt,
      temperature: 0.6,
      maxOutputTokens: 2048,
    };
    
    // We filter out the 'system' role from the contents since we pass it via config
    const geminiContents = chatMessages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }],
      }));

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: geminiContents as any,
      config: chatConfig,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const delta = chunk.text;
      if (!delta) continue;
      fullResponse += delta;
      res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }

    const savedContent = fullResponse.trim();

    if (savedContent) {
      await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: savedContent,
      });

      // Auto-update conversation title and timestamp
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
      if (conv) {
        if (conv.title === "New Chat") {
          const newTitle = content.trim().slice(0, 60) + (content.trim().length > 60 ? "…" : "");
          await db.update(conversations).set({ title: newTitle }).where(eq(conversations.id, conversationId));
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    const errMsg = err?.message ?? String(err);
    const errStatus = err?.status ?? err?.statusCode ?? null;
    console.error("[chat] AI error:", errStatus, errMsg, err?.error ?? "");
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: `AI error: ${errMsg}` })}\n\n`);
      res.end();
    } else {
      res.status(503).json({ error: "AI service unavailable. Please try again." });
    }
  }
});

export default router;
