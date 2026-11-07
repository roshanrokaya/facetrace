# Backend Setup Guide

## Prerequisites
- Python 3.11+
- PostgreSQL 16 with pgvector extension
- pip

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Set up PostgreSQL with pgvector:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE facetrace;

# Connect to the database
\c facetrace

# Enable pgvector extension
CREATE EXTENSION vector;
```

6. Run database migrations:
```bash
alembic upgrade head
```

7. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000
API documentation (Swagger UI): http://localhost:8000/docs

## Development

### Adding a new model
1. Create the model in `app/models/`
2. Generate a migration:
```bash
alembic revision --autogenerate -m "description"
```
3. Apply the migration:
```bash
alembic upgrade head
```

### Running tests
```bash
pytest
```

### Using Docker
```bash
docker-compose up backend
```
