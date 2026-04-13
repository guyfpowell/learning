# Learning App - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Local Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start Docker services** (PostgreSQL 5433, Redis 6380):
   ```bash
   docker-compose up -d
   ```

3. **Start development servers** (all in parallel):
   ```bash
   pnpm dev
   ```

   This will start:
   - **API**: http://localhost:3000 (with `/health` endpoint)
   - **Web**: http://localhost:3001

### Port Reference

| Service | Port | Host |
|---------|------|------|
| PostgreSQL | 5433 | localhost |
| Redis | 6380 | localhost |
| API | 3000 | localhost |
| Web | 3001 | localhost |
| Ollama (optional) | 11435 | localhost |

### Environment Files

- `packages/api/.env.local` - API configuration
- `packages/web/.env.local` - Web frontend configuration

### Useful Commands

```bash
# Stop Docker services
docker-compose down

# View Docker logs
docker-compose logs -f

# Rebuild packages
pnpm build

# Run tests
pnpm test

# Format code
pnpm format
```

### Docker Compose Services

- **PostgreSQL**: Latest Alpine image with automatic health checks
- **Redis**: Latest Alpine image for caching & job queue
- **Ollama** (optional): Uncomment in `docker-compose.yml` for local LLM inference

### Database Connection

From API code, use the connection string from `.env.local`:
```
postgresql://learning_user:learning_password@localhost:5433/learning_app
```

### Next Steps

1. Run `pnpm install` to install dependencies
2. Configure `.env.local` files if needed
3. Run `docker-compose up` to start services
4. Run `pnpm dev` to start development servers
5. Visit http://localhost:3001 for the web app
