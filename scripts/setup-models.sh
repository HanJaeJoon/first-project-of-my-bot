#!/usr/bin/env bash
set -euo pipefail

# Ollama 모델 다운로드 스크립트
# 한국어 RAG 권장 조합을 기본으로 받음.
# .env 의 EMBEDDING_MODEL / CHAT_MODEL 값을 우선 사용.

ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

EMBEDDING_MODEL="${EMBEDDING_MODEL:-bge-m3}"
CHAT_MODEL="${CHAT_MODEL:-qwen2.5:7b}"
CONTAINER="${OLLAMA_CONTAINER:-ollama}"

run_ollama() {
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER}$"; then
    docker exec -i "$CONTAINER" ollama "$@"
  else
    ollama "$@"
  fi
}

echo "Pulling models for Korean RAG..."
echo "  embedding: $EMBEDDING_MODEL"
echo "  chat     : $CHAT_MODEL"

run_ollama pull "$EMBEDDING_MODEL"
run_ollama pull "$CHAT_MODEL"

echo ""
echo "Done. Installed models:"
run_ollama list
