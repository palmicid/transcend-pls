#!/bin/sh
set -e

MODEL=${OLLAMA_MODEL:-llama3}

echo "🔹 Starting Ollama server..."
ollama serve &

# Wait for Ollama to be ready
until ollama list >/dev/null 2>&1; do
  sleep 1
done

echo "🔹 Ensuring model '$MODEL' is available..."
ollama pull "$MODEL"

echo "✅ Ollama is ready with model: $MODEL"

wait
