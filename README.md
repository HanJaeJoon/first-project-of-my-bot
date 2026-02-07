# Mini RAG Knowledge Base Chatbot (Local)

완전 로컬 RAG 챗봇. Ollama를 사용하여 **API 키 없이** 무료로 동작합니다.

## Features

- 🏠 **100% Local**: 외부 API 없음, 데이터가 로컬에만 저장
- 🆓 **무료**: Ollama + 오픈소스 모델 사용
- 🐳 **Docker 지원**: `docker-compose up` 한 줄로 환경 구성
- 📚 **Document Ingestion**: `.txt`, `.md` 파일 지식 베이스화
- 🔍 **Semantic Search**: 벡터 유사도 기반 문서 검색
- ⚙️ **모델 선택 가능**: Qwen2.5, Llama3.1, Gemma3 등

## Requirements

- Docker & Docker Compose (권장)
- 또는 [Ollama](https://ollama.ai) 직접 설치
- RAM: 최소 8GB (16GB 권장)

## Quick Start

### 1. Start Ollama (Docker)

```bash
# Ollama 컨테이너 시작
docker-compose up -d

# 모델 다운로드 (최초 1회)
docker exec -it ollama ollama pull qwen2.5:3b
docker exec -it ollama ollama pull nomic-embed-text
```

또는 스크립트 사용:
```bash
chmod +x scripts/setup-models.sh
./scripts/setup-models.sh
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure (optional)

```bash
cp .env.example .env
# 필요시 모델 변경
```

### 4. Add documents

`knowledge/` 폴더에 `.txt` 또는 `.md` 파일 추가

### 5. Ingest & Chat

```bash
# 문서 임베딩
npm run ingest

# 챗봇 시작
npm start
```

## Available Models

### LLM (Chat)

| Model | Size | RAM | 특징 |
|-------|------|-----|------|
| `qwen2.5:3b` | ~2GB | 4GB+ | 빠름, 한국어 OK |
| `qwen2.5:7b` | ~4GB | 8GB+ | 균형 |
| `llama3.1:8b` | ~5GB | 8GB+ | 영어 우수 |
| `gemma3:4b` | ~3GB | 6GB+ | Google 모델 |
| `qwen2.5:14b` | ~8GB | 16GB+ | 고품질 |

### Embedding

| Model | Size | 특징 |
|-------|------|------|
| `nomic-embed-text` | ~275MB | 추천, 빠름 |
| `mxbai-embed-large` | ~670MB | 고품질 |

## Project Structure

```
├── index.js              # CLI entry point
├── docker-compose.yml    # Ollama 컨테이너
├── scripts/
│   └── setup-models.sh   # 모델 다운로드 스크립트
├── src/
│   ├── loader.js         # Document loading & chunking
│   ├── embeddings.js     # Ollama API wrapper
│   ├── vectorStore.js    # Vector store (cosine similarity)
│   └── rag.js            # RAG pipeline
├── knowledge/            # Your documents
├── data/                 # Vector storage
└── .env.example
```

## Commands

```bash
npm start          # 챗봇 시작
npm run ingest     # 문서 임베딩
npm run check      # Ollama 상태 확인
npm run docker:up  # Ollama 컨테이너 시작
npm run docker:down # 컨테이너 중지
```

### Chat Commands

- `/stats` - 지식 베이스 통계
- `/sources` - 로드된 문서 목록
- `/check` - Ollama 연결 상태
- `/quit` - 종료

## Configuration

`.env` 파일:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama 서버 주소 |
| `EMBEDDING_MODEL` | `nomic-embed-text` | 임베딩 모델 |
| `CHAT_MODEL` | `qwen2.5:3b` | LLM 모델 |
| `CHUNK_SIZE` | `500` | 청크 크기 |
| `TOP_K` | `3` | 검색 결과 수 |

## GPU Acceleration

NVIDIA GPU 사용 시 `docker-compose.yml`에서 주석 해제:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

## AnythingLLM (Optional)

웹 UI가 필요하면 `docker-compose.yml`에서 AnythingLLM 주석 해제 후:

```bash
docker-compose up -d
# http://localhost:3001 접속
```

## License

MIT

---

*Created with help from OpenClaw* ⚡
