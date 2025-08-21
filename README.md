# Zilliance - Enterprise Tutorial & Workflow Platform

A unified enterprise automation platform that combines tutorial creation, workflow automation, video management, and API testing into one seamless experience.

## Features

- **Tutorial Builder**: Create interactive step-by-step tutorials with media support
- **Workflow Engine**: Visual workflow automation with node-based editor
- **Video Platform**: Professional video hosting and streaming
- **API Gateway**: Advanced API testing and management
- **Enterprise Security**: Built-in validation, rate limiting, and audit logging

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zilliance
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Start development servers:
```bash
# Terminal 1: Start backend API
npm run server

# Terminal 2: Start frontend dev server
npm run dev
```

5. Open http://localhost:8080 in your browser

## Development

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend API server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing

- `npm test` - Run unit tests (Vitest)
- `npm run test:ui` - Run tests with UI
- `npm run e2e` - Run end-to-end tests (Playwright)

### Bundle Analysis

- `npm run analyze` - Generate bundle analysis report
- View `dist/analyze.html` for detailed bundle breakdown

### Environment Variables

See `.env.example` for all available configuration options:

- `VITE_API_URL` - Backend API URL
- `ALLOWED_ORIGIN` - CORS allowed origin
- `PORT` - Backend server port
- `ANALYZE` - Enable bundle analysis

## Architecture

### Backend (Express + SQLite)

- RESTful API with Zod validation
- SQLite database with WAL mode
- Rate limiting and security headers
- Structured logging with request IDs
- File upload and streaming support

### Frontend (React + TypeScript)

- Modern React with hooks and TypeScript
- Shadcn/ui component library
- Code-split heavy components
- Hover prefetch for performance
- Skeleton loading states

### Database Schema

- `tutorials` - Tutorial metadata
- `steps` - Tutorial step recordings
- `media` - Video/audio files
- `workflows` - Automation workflows

## API Endpoints

### Tutorials
- `POST /api/tutorials` - Create tutorial
- `GET /api/tutorials` - List tutorials
- `GET /api/tutorials/:id` - Get tutorial with steps
- `POST /api/tutorials/:id/steps` - Add steps
- `POST /api/tutorials/:id/media` - Upload media
- `GET /api/tutorials/:id/media` - Stream media

### Workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/:id` - Get workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
