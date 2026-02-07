# Mini RAG Knowledge Base Chatbot

개인 문서 기반 RAG(Retrieval-Augmented Generation) 챗봇. 텍스트/마크다운 파일을 지식 베이스로 저장하고, 질문에 대해 관련 문서를 검색하여 답변을 생성합니다.

## Features

- 📚 **Document Ingestion**: `.txt`, `.md` 파일을 청크로 분할하여 임베딩 생성
- 🔍 **Semantic Search**: 질문과 유사한 문서 청크를 코사인 유사도로 검색
- 🤖 **RAG Pipeline**: 검색된 컨텍스트 기반 LLM 답변 생성
- 💾 **Persistent Storage**: JSON 기반 벡터 저장 (외부 DB 불필요)
- ⚙️ **Configurable**: 환경 변수로 모델, 청크 크기 등 설정 가능

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# .env 파일에 OPENAI_API_KEY 입력
```

### 3. Add documents

`knowledge/` 폴더에 `.txt` 또는 `.md` 파일 추가

### 4. Ingest documents

```bash
npm run ingest
```

### 5. Start chatting

```bash
npm start
# or
npm run chat
```

## Project Structure

```
├── index.js              # CLI entry point
├── src/
│   ├── loader.js         # Document loading & chunking
│   ├── embeddings.js     # OpenAI embeddings & chat
│   ├── vectorStore.js    # Simple vector store with cosine similarity
│   └── rag.js            # RAG pipeline (ingest + query)
├── knowledge/            # Your documents go here
├── data/                 # Vector storage (auto-generated)
├── .env.example          # Environment template
└── package.json
```

## Configuration

`.env` 파일에서 설정 가능:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API 키 (필수) |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | 임베딩 모델 |
| `CHAT_MODEL` | `gpt-4o-mini` | 채팅 모델 |
| `CHUNK_SIZE` | `500` | 텍스트 청크 크기 (문자 수) |
| `CHUNK_OVERLAP` | `50` | 청크 간 오버랩 |
| `TOP_K` | `3` | 검색 시 반환할 청크 수 |

## Commands

Interactive mode에서 사용 가능한 명령어:

- `/stats` - 지식 베이스 통계
- `/sources` - 로드된 문서 목록
- `/quit` - 종료

## How It Works

1. **Ingest**: 문서를 청크로 분할 → OpenAI로 임베딩 생성 → JSON 파일에 저장
2. **Query**: 질문 임베딩 생성 → 유사 청크 검색 (cosine similarity) → LLM에 컨텍스트와 함께 전달 → 답변 생성

## License

MIT

---

*Created with help from OpenClaw* ⚡
