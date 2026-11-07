# Face Trace System

A web-based face recognition system for campus entry tracking, person tracing, and visitor analytics.

## Overview

Face Trace automatically recognizes enrolled people from camera frames, logs where and when each person was seen, and turns those logs into traces, attendance, and footfall analytics. It goes beyond CRUD through face embedding matching, event deduplication, dwell-time calculation, and anomaly detection.

## Features

- **Face Recognition**: Real-time detection and recognition using pre-trained face embeddings
- **Entry Tracking**: Automatic logging of all entries with camera, time, and confidence
- **Person Tracing**: Timeline view showing where and when each person was seen
- **Attendance Analytics**: Automatic attendance percentage calculation
- **Alerts**: Unknown face detection, low attendance warnings, unusual entry time alerts
- **Live Monitoring**: Real-time camera feed with recognition overlays
- **Role-Based Access**: Admin, Operator, and Viewer roles with appropriate permissions

## Tech Stack

### Backend
- **Framework**: FastAPI with Uvicorn
- **Database**: PostgreSQL 16 with pgvector extension
- **Face Recognition**: OpenCV, InsightFace (ONNX Runtime), NumPy
- **Security**: python-jose (JWT), passlib bcrypt
- **Jobs**: APScheduler for nightly tasks
- **Testing**: pytest, httpx

### Frontend
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)

### Using Docker Compose

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
3. Start all services:
   ```bash
   docker-compose up -d
   ```
4. The services will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - PostgreSQL: localhost:5432

### Local Development

For detailed setup instructions, see:
- [Backend Setup Guide](BACKEND_SETUP.md)
- [Frontend Setup Guide](FRONTEND_SETUP.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
face-trace/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── alembic/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── api/v1/
│   │   └── storage/
│   └── tests/
└── frontend/
    ├── package.json
    ├── middleware.ts
    ├── app/
    ├── components/
    ├── lib/
    └── hooks/
```

## Database Setup

The database uses PostgreSQL with the pgvector extension for face embedding similarity search.

Run migrations:
```bash
cd backend
alembic upgrade head
```

## Default Users

After first setup, create an admin user through the API or use the seed script (if available).

## Security & Privacy

- All passwords are hashed using bcrypt
- JWT tokens expire after 60 minutes
- Face embeddings are stored as vectors, not raw images
- Snapshots are auto-deleted after a configurable retention period
- Consent is required before enrollment
- All sensitive actions are logged in the audit trail

## License

This project is for educational purposes. See LICENSE file for details.

## Contributing

This is a university project. Please follow the project plan and documentation provided.
