# HIKARI — Production Deployment & DevOps Guide (V2)
### Containerization, CI/CD, Observability, and Hosting Specifications

---

## 1. CONTAINERIZATION (DOCKER)

### Backend Dockerfile (`Dockerfile.backend`)
```dockerfile
# Multi-stage build for FastAPI backend
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.11-slim AS runner

WORKDIR /app

# Copy dependencies
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
ENV PORT=8000

EXPOSE 8000

CMD ["python", "main.py"]
```

### Frontend Dockerfile (`Dockerfile.frontend`)
```dockerfile
# Multi-stage build for Next.js frontend
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend

  backend:
    build:
      context: ./hikari-api
      dockerfile: Dockerfile.backend
    environment:
      - PORT=8000
      - HOST=0.0.0.0
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - BASE_RPC_URL=${BASE_RPC_URL}
      - BACKEND_PRIVATE_KEY=${BACKEND_PRIVATE_KEY}
      - PRIVATE_CONTRACT_ADDRESS=${PRIVATE_CONTRACT_ADDRESS}
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./hikari-web
      dockerfile: Dockerfile.frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    ports:
      - "3000:3000"
```

### Nginx Gateway (`nginx.conf`)
```nginx
events { worker_connections 1024; }

http {
    include mime.types;
    sendfile on;

    server {
        listen 80;
        server_name localhost;

        # Frontend Reverse Proxy
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend FastAPI Reverse Proxy
        location /api/ {
            proxy_pass http://backend:8000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Automation Script (`Makefile`)
```makefile
.PHONY: build up down logs test clean

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

test:
	cd hikari-contracts && npx hardhat test
	cd hikari-api && pytest

clean:
	docker compose down --volumes --rmi all
```

---

## 2. CI/CD WORKFLOWS (GITHUB ACTIONS)

Configuration for `.github/workflows/deploy.yml`:
```yaml
name: Hikari CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r hikari-api/requirements.txt
          pip install pytest
      - name: Run Backend Tests
        run: |
          cd hikari-api && pytest

  validate-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd hikari-contracts && npm ci
      - name: Run Hardhat Tests
        run: |
          cd hikari-contracts && npx hardhat test

  validate-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd hikari-web && npm ci
      - name: Check Lint & Types
        run: |
          cd hikari-web && npm run lint
      - name: Next Build Check
        run: |
          cd hikari-web && npm run build
```

---

## 3. OBSERVABILITY & MONITORING CONFIGURATIONS

### Sentry integration (Error Monitoring)
- **Dashboard:** Tracks exceptions thrown during LangGraph agent execution.
- **Backend Setup (`main.py` entrypoint):**
  ```python
  import sentry_sdk
  from sentry_sdk.integrations.fastapi import FastAPIIntegration

  sentry_sdk.init(
      dsn="https://sentry_your_dns_here",
      integrations=[FastAPIIntegration()],
      traces_sample_rate=1.0,
      profiles_sample_rate=1.0,
  )
  ```

### LangSmith configuration (Agent Tracing)
To trace LLM calls, coordinate mapping, and reflection loops:
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_your_langsmith_key_here
LANGCHAIN_PROJECT="hikari-agents"
```

### PostHog Integration (Product Analytics)
To capture student screen-reader usage metrics:
- **Metrics:** Tracks click counts on accessible elements, quiz completions, and WebRTC interruptions.
- **Frontend Config (`_app.tsx` or `layout.tsx`):**
  ```typescript
  import posthog from 'posthog-js'
  if (typeof window !== 'undefined') {
    posthog.init('phc_your_key_here', { api_host: 'https://app.posthog.com' })
  }
  ```

---

## 4. STEP-BY-STEP PRODUCTION DEPLOYMENT INSTRUCTIONS

### Step 1: Deploy Database on Supabase
1.  Sign in to [Supabase](https://supabase.com/).
2.  Create a new project. Select the nearest geographical region.
3.  Navigate to the SQL Editor, paste the contents of the SQL schemas from `HIKARI_COMPLETE_DESIGN_V2.md`, and click **Run**.
4.  Copy the connection string from Settings -> Database.

### Step 2: Set Up Vector Storage on Qdrant
1.  Sign in to [Qdrant Cloud](https://qdrant.to/).
2.  Create a free cluster (1GB capacity tier).
3.  Generate an API key and copy the Cluster URL and API key.

### Step 3: Deploy Frontend on Vercel
1.  Push the project code to your GitHub repository.
2.  Sign in to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
3.  Select the `hikari-web` directory.
4.  Set the Framework Preset to **Next.js**.
5.  Add the environment variables:
    - `NEXT_PUBLIC_API_URL`: Set to your deployed backend domain (e.g. `https://hikari-backend.railway.app`).
6.  Click **Deploy**.

### Step 4: Deploy Backend on Railway
1.  Sign in to [Railway](https://railway.app/).
2.  Click **New Project** -> **Deploy from GitHub repository**.
3.  Select the root folder, and set the root directory to `hikari-api`.
4.  Navigate to Variables, and populate the `.env` settings:
    - `GEMINI_API_KEY`: Google Generative AI key.
    - `BASE_RPC_URL`: Set to Base Sepolia RPC link.
    - `BACKEND_PRIVATE_KEY`: Sepolia deployer private key.
    - `PRIVATE_CONTRACT_ADDRESS`: The deployed private contract address.
5.  Railway will automatically detect the port and build the FastAPI runner.
