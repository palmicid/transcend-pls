import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rateLimit"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"

  if (!rateLimit(ip)) {
    return new Response("Too many requests", { status: 429 })
  }

  let prompt: string
  try {
    const body = await req.json()
    prompt = body.prompt
    if (!prompt) throw new Error()
  } catch {
    return new Response("Invalid input", { status: 400 })
  }

  try {
    const res = await fetch("http://ollama:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err) {
    return new Response("LLM error", { status: 500 })
  }
}
