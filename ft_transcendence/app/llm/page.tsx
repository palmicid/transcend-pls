"use client"

import { useState, useRef } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function LLMChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    const res = await fetch("/api/llm/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMessage.content }),
    })

    if (!res.body) {
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let assistantMessage: Message = { role: "assistant", content: "" }
    setMessages(prev => [...prev, assistantMessage])

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (!line.startsWith("data:")) continue
        const json = line.replace("data:", "").trim()
        if (json === "[DONE]") continue

        try {
          const parsed = JSON.parse(json)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
            assistantMessage.content += token
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { ...assistantMessage }
              return copy
            })
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    setLoading(false)
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <header className="p-4 border-b text-lg font-semibold">
        AI Assistant
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-3xl px-4 py-3 rounded-lg whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-white border"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-white border px-4 py-3 rounded-lg">
            typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <footer className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            className="flex-1 border rounded p-2 resize-none"
            rows={2}
            placeholder="Send a message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 border rounded bg-black text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </footer>
    </main>
  )
}
