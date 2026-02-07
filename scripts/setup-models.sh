#!/bin/bash

# Ollama 모델 다운로드 스크립트
# 사용할 모델 선택하여 주석 해제

echo "🚀 Pulling Ollama models..."

# LLM 모델 (하나 선택)
# 경량 (~2GB)
ollama pull qwen2.5:3b

# 중간 (~4GB)
# ollama pull qwen2.5:7b
# ollama pull llama3.1:8b
# ollama pull gemma3:4b

# 고성능 (~8GB+)
# ollama pull qwen2.5:14b
# ollama pull llama3.1:70b

# 임베딩 모델
ollama pull nomic-embed-text

echo "✅ Model setup complete!"
echo ""
echo "Installed models:"
ollama list
