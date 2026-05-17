#  VehicleScope
**Intelligent, asynchronous vehicle image processing pipeline.**

VehicleScope is an end-to-end full-stack application designed to automatically detect and flag issues in uploaded vehicle images. Built with an event-driven architecture, it processes images concurrently through 8 distinct detection layers to identify blurring, poor lighting, duplicates, screenshots, and signs of tampering.

The project features a striking **Brutalist UI** frontend backed by a robust, non-blocking **Express + BullMQ** backend architecture.

---

##  Core Features

- **Asynchronous Processing Pipeline**: Uploads are queued instantly via BullMQ and Redis, keeping the API fast and responsive. Background workers process images decoupled from the web server.
- **8 Concurrent Detection Layers**:
  1.  **Blur Detection** *(Laplacian variance analysis)*
  2.  **Brightness Check** *(Mean channel luminance)*
  3.  **Duplicate Detection** *(MD5 historical hashing)*
  4.  **Screenshot Detection** *(Resolution heuristics & EXIF signals)*
  5.  **Dimension Validation** *(Aspect ratio bounding)*
  6.  **Number Plate OCR** *(Tesseract.js dual-pass character extraction)*
  7.  **Metadata Analysis** *(EXIF editing software signals)*
  8.  **Tamper Heuristics** *(Quadrant variance analysis)*
- **Fault-Tolerant execution**: If the OCR engine fails, the other 7 checks still complete and return partial insights.
- **Brutalist Design System**: High-contrast, bold typography, zero border-radius, and harsh shadows. Built entirely with Tailwind CSS and standard React components.

---

##  Tech Stack

**Frontend**
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (Custom Brutalist Theme)
- **Routing:** React Router DOM

**Backend**
- **Framework:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Queue System:** BullMQ + Redis
- **Image Processing:** Sharp
- **OCR Engine:** Tesseract.js
- **Metadata Parser:** Exifr
- **Logging:** Winston

**Infrastructure**
- Docker & Docker Compose (Multi-container deployment)

---

##  Quick Start (Recommended)

The easiest way to run VehicleScope is via Docker Compose. This spins up the API, Frontend UI, Redis, PostgreSQL, and the background Worker automatically.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed and running.

### 1. Clone & Build
```bash
git clone <repository-url>
cd vehiclescope

# Start all services in detached mode
docker compose up -d --build
```

### 2. Access the Application
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### 3. Teardown
```bash
# Stop and remove all containers and volumes
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

##  Architecture Flow

1. **User** uploads an image via the React Frontend.
2. The **Express API** saves the file to disk and creates a `PENDING` job in **PostgreSQL**.
3. The API enqueues a job payload to **BullMQ (Redis)** and immediately returns the Job ID to the user.
4. The **Worker Process** picks up the job and runs the 8 detection layers using `Promise.all`.
5. The Worker saves the granular analysis results to Postgres and marks the job as `COMPLETED`.
6. The Frontend, polling the API, sees the status change and routes the user to the detailed analysis view.

---

##  API Reference

### `POST /api/upload`
Uploads a vehicle image for analysis.
- **Body**: `multipart/form-data` containing an `image` file.
- **Returns**: `{ jobId: string, status: "pending" }`

### `GET /api/jobs/:id`
Returns the status and overall risk classification of a job.

### `GET /api/jobs/:id/result`
Returns the complete, granular output from all 8 detection layers.

---

##  Design Decisions & Trade-offs

- **Why BullMQ?** Image processing is CPU-bound and slow. Using `setTimeout` or running it inline would block the Node.js event loop, preventing the API from serving other requests. BullMQ ensures reliability, exponential backoff retries, and scalability.

- **Local Disk Storage**: Images are temporarily stored in `backend/uploads/` for simplicity. In a production environment, this would be swapped out for a cloud blob store (like AWS S3) accompanied by pre-signed URLs.

---


