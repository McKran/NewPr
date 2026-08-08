#!/bin/bash
# Start Ollama server and pull DeepSeek model if not already present.
# Run this before starting the API server.

set -e

MODEL="deepseek-r1:1.5b"

echo "[ollama] Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
for i in $(seq 1 30); do
  if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "[ollama] Server ready."
    break
  fi
  echo "[ollama] Waiting for server... ($i/30)"
  sleep 2
done

# Pull DeepSeek if not present
if ! ollama list | grep -q "deepseek-r1"; then
  echo "[ollama] Pulling $MODEL (this may take a few minutes)..."
  ollama pull "$MODEL"
  echo "[ollama] Model ready."
else
  echo "[ollama] DeepSeek model already present."
fi

echo "[ollama] PID: $OLLAMA_PID"
