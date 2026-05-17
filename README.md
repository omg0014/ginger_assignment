# VehicleScope

Intelligent, asynchronous vehicle image processing pipeline. Upload a vehicle image — get back a structured risk analysis across 8 detection checks.

---

## What It Does

Users upload a vehicle image. The system immediately returns a Job ID, then processes the image in the background through 8 detection checks running concurrently. Results include a `0–100%` risk score, `LOW / MEDIUM / HIGH` classification, and per-check breakdown with details.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| API | Node.js + Express + TypeScript |
| Queue | BullMQ + Redis |
| Database | PostgreSQL + Prisma ORM |
| Image Analysis | Sharp, Tesseract.js, Exifr |
| Infrastructure | Docker Compose |

---

## Architecture

```
User → POST /api/upload → Express API
                              │
                    Save file + create Job (PENDING)
                              │
                    Push to BullMQ (Redis)
                              │
                         Worker Process
                              │
                    Run 8 checks (Promise.all)
                              │
                    Save Analysis → Job = COMPLETED
                              │
              Frontend polls GET /api/jobs/:id every 2s
```

Retries: 3 attempts, exponential backoff (`2s → 8s → 32s`). One failed check never kills the other 7.

---

## Quick Start

```bash
git clone https://github.com/omg0014/ginger_assignment.git
cd ginger_assignment

docker compose up --build
```

- Frontend → `http://localhost:3000`
- API → `http://localhost:3001`

```bash
# Tear down
docker compose down -v
```

---

##  Local Development (Manual Setup)

If you prefer to run the services bare-metal without Docker:

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally)
- Redis (running locally)

### 1. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# (Edit .env with your local Postgres and Redis credentials)

# Generate Prisma Client & Run Migrations
npx prisma generate
npx prisma db push

# Start the API server
npm run dev

# Open a NEW terminal and start the Worker
npm run worker
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start the Vite dev server
npm run dev
```
Navigate to `http://localhost:3000`.

---


## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload image, returns `jobId` immediately |
| `GET` | `/api/jobs/:id` | Poll job status |
| `GET` | `/api/jobs/:id/result` | Full analysis with all 8 checks |
| `GET` | `/api/history` | Paginated job history |
| `GET` | `/api/analytics` | Stats, risk trends, issue breakdown |
| `GET` | `/health` | System health check |

**Upload example:**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "image=@vehicle.jpg"
# → { "jobId": "550e8400...", "status": "pending" }
```

---

## Detection Checks

All 8 run concurrently. Each returns `passed`, `score (0–1)`, `confidence`, and a `detail` string.

| # | Check | How |
|---|---|---|
| 01 | Blur Detection | Pixel std-dev sharpness via Sharp |
| 02 | Brightness Analysis | Mean channel luminance — flags dark/overexposed |
| 03 | Duplicate Detection | MD5 hash matched against job history |
| 04 | Screenshot Detection | Screen resolution + missing EXIF camera signals |
| 05 | Dimension Validation | Width, height, aspect ratio bounds |
| 06 | Number Plate OCR | Tesseract.js dual-pass + Indian plate regex `XX00XX0000` |
| 07 | Metadata Analysis | EXIF inspection — editing software, GPS, timestamps |
| 08 | Tamper Detection | Per-quadrant pixel variance ratio |

**Risk score:** weighted average of all check scores → `< 0.3` LOW · `0.3–0.6` MEDIUM · `> 0.6` HIGH

---

## Design Decisions

**Why BullMQ?** Image processing is slow and CPU-bound. Running it inline would block the event loop. BullMQ decouples the worker from the API, persists jobs through restarts, and supports retries.

**Why per-check error isolation?** If Tesseract fails on a corrupt file, the other 7 checks should still complete. Each check catches its own errors and returns a result object instead of throwing.

**Why MD5 for duplicates?** Fast, deterministic, and sufficient for exact file-level matching. Perceptual hashing (pHash) would be needed for near-duplicate detection.

**What I'd improve:** S3 for file storage, WebSockets instead of polling, trained ML models for blur/tamper instead of heuristics, and Jest unit tests per check.

---

## AI Usage

Used AI for: initial scaffolding, BullMQ boilerplate, Docker Compose setup, Tailwind UI components.

**Where it was wrong:** AI generated `Tesseract.recognize()` — the v4 API that doesn't exist in v5. Fixed by switching to `createWorker()` → `setParameters()` → `worker.recognize()`. Also generated filename-based duplicate detection — replaced with MD5 hashing.

**Validation approach:** every function tested manually with real vehicle images before wiring to the frontend.

---

## Assumptions

- One image per upload (no batch)
- Target number plate format: Indian (`MH12AB1234`)
- Duplicate = byte-identical file, not visually similar
- No auth required for this assignment
