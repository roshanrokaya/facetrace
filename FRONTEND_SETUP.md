# Frontend Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Development

### Building for production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Using Docker
```bash
docker-compose up frontend
```

## Project Structure

- `app/` - Next.js App Router pages
  - `(auth)/` - Authentication pages (login)
  - `(app)/` - Main application pages with layout
- `components/` - Reusable React components
  - `ui/` - UI components (buttons, dialogs, etc.)
  - `charts/` - Chart components using Recharts
- `lib/` - Utility functions and API client
- `hooks/` - Custom React hooks

## Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **Recharts** - Charts and visualizations
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Next Steps

TODO items in the codebase that need implementation:

1. Complete API client in `lib/api.ts` with proper error handling
2. Implement authentication helpers in `lib/auth.ts`
3. Add WebSocket connections in hooks:
   - `use-events-socket.ts` for live events
   - `use-camera-stream.ts` for camera feeds
4. Build UI components in `components/ui/`
5. Implement all page components with actual API calls
6. Add shadcn/ui components for consistent UI
7. Set up TanStack Query for data fetching
8. Implement form validation with React Hook Form + Zod
