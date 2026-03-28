# 🔐 AuthApp — Google OAuth + PostgreSQL + Redis + Docker

Full-stack authentication app with Google Sign-In, session management,
audit logging, and Redis caching — fully containerised.

---

## 🧱 Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, React Router v6    |
| Backend     | Node.js 20, Express, Passport.js   |
| Auth        | Google OAuth 2.0 (passport-google-oauth20) |
| Database    | PostgreSQL 16 (pg pool)            |
| Cache       | Redis 7 (ioredis + connect-redis)  |
| Sessions    | express-session → Redis store      |
| Container   | Docker + Docker Compose            |
| Web server  | Nginx (frontend static + proxy)    |

---

## 📁 Project Structure

```
.
├── docker-compose.yml
├── .env.example
├── db/
│   └── init.sql              # Schema, indexes, triggers
├── backend/
│   ├── server.js             # Express entry point
│   ├── Dockerfile
│   ├── config/
│   │   ├── db.js             # PostgreSQL pool
│   │   ├── redis.js          # ioredis client + helpers
│   │   └── passport.js       # Google OAuth strategy
│   ├── middleware/
│   │   └── auth.js           # requireAuth guard
│   └── routes/
│       ├── auth.js           # /auth/* endpoints
│       └── user.js           # /users/* endpoints
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   └── AuthContext.jsx
        └── pages/
            ├── Login.jsx
            └── Dashboard.jsx
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Prerequisites

```bash
# Verify installed versions
docker --version          # >= 24.0
docker compose version    # >= 2.20
node --version            # >= 20 (for local dev only)
```

### Step 2 — Clone & configure

```bash
git clone https://github.com/your-org/auth-app.git
cd auth-app
cp .env.example .env
```

### Step 3 — Create Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set application type: **Web application**
6. Add Authorised redirect URI:
   ```
   http://localhost:5000/auth/google/callback
   ```
   (For production: `https://yourdomain.com/auth/google/callback`)
7. Copy the **Client ID** and **Client Secret** into your `.env`:
   ```ini
   GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
   ```

### Step 4 — Set strong secrets in .env

```bash
# Generate a session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output into `SESSION_SECRET` in your `.env`.
Also update `POSTGRES_PASSWORD` and `REDIS_PASSWORD` to strong values.

### Step 5 — Build & start all containers

```bash
docker compose up --build
```

This will:
- Build the Node.js backend image (multi-stage)
- Build the React + Nginx frontend image (multi-stage)
- Start PostgreSQL with the init.sql schema
- Start Redis with password auth and 256MB memory limit
- Wire all services on a private `app_network` bridge

### Step 6 — Verify everything is running

```bash
# Check container health
docker compose ps

# Test the health endpoint
curl http://localhost:5000/health
# Expected: {"status":"ok","services":{"postgres":"connected","redis":"connected"}}
```

### Step 7 — Open the app

```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
```

Click **Continue with Google** → authenticate → land on Dashboard.

---

## 🛠 Local Development (without Docker)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev       # nodemon hot-reload on port 5000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev       # Vite dev server on port 3000
```

> You'll still need Postgres and Redis running locally or via:
> ```bash
> docker compose up postgres redis
> ```

---

## 🌐 API Endpoints

| Method | Route                    | Auth | Description                  |
|--------|--------------------------|------|------------------------------|
| GET    | /auth/google             | ✗    | Initiate Google OAuth        |
| GET    | /auth/google/callback    | ✗    | OAuth callback               |
| GET    | /auth/me                 | ✗    | Current session info         |
| POST   | /auth/logout             | ✓    | Destroy session              |
| GET    | /users/profile           | ✓    | Profile (Redis-cached 5 min) |
| GET    | /users/activity          | ✓    | Last 10 login events         |
| DELETE | /users/account           | ✓    | Permanently delete account   |
| GET    | /health                  | ✗    | Postgres + Redis health      |

---

## 🗄 Database Schema

```sql
-- users table
id, google_id, email, display_name, first_name, last_name,
avatar_url, locale, is_active, created_at, updated_at, last_login

-- login_events table (audit log)
id, user_id, ip_address, user_agent, event_type, created_at
```

---

## 🔒 Security Features

- **Helmet.js** — HTTP security headers
- **Rate limiting** — 100 req/15 min on `/auth/*`
- **HttpOnly cookies** — session cookie not accessible from JS
- **Secure flag** — cookies only sent over HTTPS in production
- **SameSite=Strict** — CSRF protection in production
- **Non-root Docker user** — containers run as `appuser`
- **PostgreSQL role** — separate readonly role for monitoring
- **Session stored in Redis** — not in-memory (survives restart)

---

## ☁️ Production Deployment (Azure / AWS)

### Azure
- **App Service** or **AKS** for containers
- **Azure Database for PostgreSQL Flexible Server**
- **Azure Cache for Redis**
- **Azure Key Vault** for secrets (replace `.env`)
- **Application Gateway** as reverse proxy with SSL

### AWS
- **ECS Fargate** or **EKS** for containers
- **RDS for PostgreSQL** (Multi-AZ for HA)
- **ElastiCache for Redis** (cluster mode)
- **AWS Secrets Manager** for credentials
- **ALB** as load balancer + ACM for SSL

### Common production changes
```ini
NODE_ENV=production
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
CLIENT_URL=https://yourdomain.com
DB_SSL=true
```

---

## 🧪 Useful Commands

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (resets DB & Redis)
docker compose down -v

# View backend logs
docker compose logs -f backend

# Connect to PostgreSQL
docker exec -it pg_db psql -U appuser -d authapp

# Connect to Redis CLI
docker exec -it redis_cache redis-cli -a RedisP@ssword123

# Rebuild a single service
docker compose up --build backend
```
