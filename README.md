# Mini RAG Knowledge Base Chatbot (Local, Korean)

완전 로컬에서 동작하는 한국어 RAG 챗봇. Ollama + qwen2.5 + bge-m3 조합으로 **API 키 없이** 무료로 사용한다.

## Features

- 100% Local — 외부 API 없음, 모든 데이터가 로컬에 저장
- 한국어 인식 chunker — 문장 경계(`다.`, `요.`, `?` 등)를 살려 청킹
- 스트리밍 응답 — 토큰 단위로 실시간 출력
- 동시 임베딩 요청 — 인제스트 속도 향상
- TypeScript (strict) + pnpm

## Requirements

- Docker & Docker Compose (권장)
- 또는 [Ollama](https://ollama.ai) 직접 설치
- Node.js >= 20, pnpm >= 10
- RAM: 8GB 이상 (qwen2.5:7b 기준 16GB 권장)

## Quick Start

```bash
# 1. Ollama 컨테이너 시작 (볼륨 포함 초기화)
pnpm docker:reset

# 2. 모델 다운로드 (최초 1회, .env 의 모델명을 사용)
pnpm setup:models

# 3. 의존성 설치
pnpm install

# 4. 환경 설정 (선택)
cp .env.example .env

# 5. knowledge/ 폴더에 .txt / .md 추가 후 인제스트
pnpm ingest

# 6. 챗 시작 (개발 모드, tsx)
pnpm dev

# 또는 빌드 후 실행
pnpm build && pnpm start
```

## Stack

- **Language**: TypeScript (strict, `noUncheckedIndexedAccess`)
- **Runtime**: Node.js >= 20 (ESM)
- **Package manager**: pnpm 10
- **Dev runner**: `tsx`
- **Build**: `tsc` → `dist/`

## Models (qwen 계열 + bge-m3)

| 용도 | 모델 | 크기 | 특징 |
|------|------|------|------|
| 임베딩 | `bge-m3` | ~1.2GB | 한국어 강력, multilingual |
| LLM (기본) | `qwen2.5:7b` | ~4.7GB | 한국어/리소스 균형 |
| LLM (고품질) | `qwen2.5:14b` | ~9GB | 16GB+ RAM |
| LLM (저사양) | `qwen2.5:3b` | ~2GB | 빠른 응답 |

## Project Structure

```
├── tsconfig.json           # TypeScript 설정 (strict, ES2022)
├── docker-compose.yml      # Ollama 단일 서비스
├── scripts/setup-models.sh # 모델 pull 스크립트
├── dist/                   # 빌드 산출물 (tsc)
└── src/
    ├── index.ts            # 엔트리 (얇은 wrapper)
    ├── cli.ts              # CLI / 스트리밍 출력
    ├── config.ts           # 환경 변수 로딩
    ├── ollama.ts           # Ollama API (embed / chat / status)
    ├── chunker.ts          # 한국어 문장 단위 청커
    ├── loader.ts           # 파일 로더 (재귀)
    ├── vectorStore.ts      # cosine similarity, JSON 영속
    ├── rag.ts              # 인제스트 / 질의 파이프라인
    └── types.ts            # 공유 타입 정의
```

## Commands

```bash
pnpm dev             # 개발 모드 챗 시작 (tsx, 재컴파일 불필요)
pnpm build           # TypeScript 컴파일 → dist/
pnpm typecheck       # 타입 체크만 수행
pnpm start           # dist/index.js 실행 (빌드 필요)
pnpm ingest          # knowledge/ 인제스트
pnpm check           # Ollama 상태 + 모델 확인
pnpm docker:up       # Ollama 컨테이너 기동
pnpm docker:down     # 컨테이너 중지
pnpm docker:reset    # down -v && up -d (볼륨 포함 초기화)
pnpm setup:models    # .env 의 모델 pull
```

### Chat 내 명령

- `/stats` — 청크/소스 수
- `/sources` — 인덱싱된 파일 목록
- `/check` — Ollama/모델 상태 재점검
- `/quit` — 종료

## Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama 서버 |
| `EMBEDDING_MODEL` | `bge-m3` | 임베딩 모델 |
| `CHAT_MODEL` | `qwen2.5:7b` | LLM 모델 |
| `CHUNK_SIZE` | `700` | 청크 크기(문자) |
| `CHUNK_OVERLAP` | `100` | 청크 overlap |
| `TOP_K` | `4` | 검색 결과 수 |
| `CHAT_TEMPERATURE` | `0.3` | 응답 무작위성 |
| `CHAT_MAX_TOKENS` | `1024` | 응답 최대 토큰 |
| `CHAT_STREAM` | `true` | 스트리밍 여부 |
| `EMBED_CONCURRENCY` | `4` | 임베딩 동시 요청 수 |
| `KNOWLEDGE_DIR` | `./knowledge` | 문서 디렉토리 |
| `DATA_DIR` | `./data` | 벡터 저장 디렉토리 |

## GPU

NVIDIA GPU 사용 시 `docker-compose.yml` 의 `deploy:` 블록 주석을 해제.

## License

MIT
