# Development Guide

## Quick Start with Docker Compose

The easiest way to run the entire stack:

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Module Implementation Order

Follow the project plan module order (sections 4-5):

1. **Auth & Users** (Module 1)
   - Implement user authentication with JWT
   - Add role-based access control
   - Create user management endpoints

2. **Person Management** (Module 2)
   - Implement CRUD for persons
   - Add group/class management
   - Handle consent tracking

3. **Face Enrollment** (Module 3)
   - Implement face detection and validation
   - Generate embeddings using InsightFace
   - Store embeddings in pgvector

4. **Camera Management** (Module 4)
   - Add camera registration
   - Implement camera connection testing
   - Create camera worker for stream processing

5. **Recognition Engine** (Module 5)
   - Implement face detection pipeline
   - Add cosine similarity matching
   - Implement deduplication logic

6. **Trace & Sessions** (Module 6)
   - Build person trace timelines
   - Implement entry/exit session pairing
   - Calculate dwell time

7. **Analytics & Reports** (Module 7)
   - Implement footfall calculations
   - Add attendance percentage logic
   - Create CSV/PDF report generation

8. **Alerts** (Module 8)
   - Implement unknown face detection
   - Add low attendance alerts
   - Create unusual time detection with Z-score

9. **Audit & Retention** (Module 9)
   - Log all sensitive actions
   - Implement snapshot cleanup job
   - Add retention policy enforcement

## Testing Strategy

### Unit Tests
Test core business logic:
- Matcher (cosine similarity, top-k voting)
- Deduplication (cooldown windows)
- Session pairing (entry/exit logic)
- Analytics calculations (attendance, z-score)

### API Tests
Test all endpoints for:
- Success cases
- Validation errors
- Role-based access control

### System Tests
Test full flows:
- Camera → Recognition → Dashboard
- Enrollment → Recognition → Trace
- Alert generation → Acknowledgment

### Accuracy Tests
Create a test set with 15-20 volunteers:
- Capture 10 images per person
- Test in varied lighting
- Report accuracy, precision, recall, FAR, FRR

## Database Schema Reference

Key tables:
- `users` - System users with roles
- `persons` - Enrolled people
- `face_embeddings` - 512-d vectors in pgvector
- `cameras` - Registered cameras
- `recognition_events` - Recognition logs
- `sessions` - Entry/exit pairs
- `alerts` - Alert notifications
- `audit_logs` - Audit trail

Enable pgvector:
```sql
CREATE EXTENSION vector;
```

## API Reference

All endpoints are documented in Swagger UI at `/docs`:
- Authentication: `/api/v1/auth`
- Users: `/api/v1/users`
- Persons: `/api/v1/persons`
- Faces: `/api/v1/persons/{id}/faces`
- Cameras: `/api/v1/cameras`
- Events: `/api/v1/events`
- Trace: `/api/v1/trace/{person_id}`
- Analytics: `/api/v1/analytics`
- Reports: `/api/v1/reports`
- Alerts: `/api/v1/alerts`
- WebSocket: `/api/v1/ws/stream/{camera_id}`, `/api/v1/ws/events`

## Security Best Practices

1. Never commit `.env` files
2. Use bcrypt for password hashing
3. Set appropriate JWT expiry (60 min default)
4. Implement role checks on every protected route
5. Store embeddings, not raw face images
6. Auto-delete snapshots after retention period
7. Log all sensitive actions in audit trail
8. Require consent before enrollment

## Privacy & Ethics

- Obtain written consent before enrollment
- Display "face recognition in use" signs
- Never point cameras at public spaces
- Implement right to removal
- Follow Nepal's Individual Privacy Act, 2075

## Troubleshooting

### InsightFace Installation Issues
If InsightFace fails to install:
- Try using Docker (recommended)
- Fall back to `face_recognition` library (dlib)
- Use WSL on Windows

### CPU Performance Issues
If recognition is too slow:
- Process every 3rd-5th frame
- Use `buffalo_s` model instead of `buffalo_l`
- Lower camera resolution
- Add multiple workers per camera

### Database Connection Issues
- Ensure PostgreSQL is running
- Check pgvector extension is enabled
- Verify DATABASE_URL in .env
- Test with `psql` directly

## Project Resources

- Project Plan: `Face Trace System — Complete Project Plan.md`
- Backend Setup: `BACKEND_SETUP.md`
- Frontend Setup: `FRONTEND_SETUP.md`
- API Docs: http://localhost:8000/docs (when running)
