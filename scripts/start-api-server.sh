#!/bin/bash
# Start Ollama in the background, pull DeepSeek if needed, then start the API server.
set -e

MODEL="deepseek-r1:1.5b"
OLLAMA_MODELS="${OLLAMA_MODELS:-/tmp/ollama-models}"

echo "[start] Starting Ollama server..."
export OLLAMA_MODELS
export OLLAMA_HOST="127.0.0.1:11434"
ollama serve > /tmp/ollama.log 2>&1 &
OLLAMA_PID=$!
echo "[start] Ollama PID: $OLLAMA_PID"

# Wait for Ollama to be ready (up to 60 seconds)
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo "[start] Ollama is ready."
    break
  fi
  echo "[start] Waiting for Ollama... ($i/30)"
  sleep 2
done

# Pull DeepSeek if not already present
if ! ollama list 2>/dev/null | grep -q "deepseek-r1"; then
  echo "[start] Pulling $MODEL — this will take a few minutes on first run..."
  ollama pull "$MODEL" &
  echo "[start] Model pull started in background (PID: $!)."
else
  echo "[start] $MODEL already present."
fi

echo "[start] Starting API server..."
cd "$(dirname "$0")/.."
PORT=8080 pnpm --filter @workspace/api-server run dev
