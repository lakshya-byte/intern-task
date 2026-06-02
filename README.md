# ⚡ TaskFlow — Scalable REST API + Next.js Frontend

A production-ready full-stack application with **JWT authentication**, **role-based access control (RBAC)**, **Redis caching**, **Docker deployment**, and **Winston structured logging**.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB + Mongoose |
| **Caching** | Redis (ioredis) |
| **Auth** | bcryptjs + JWT |
| **Validation** | Zod |
| **Logging** | Winston + Daily Rotate File |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **Frontend** | Next.js 15, React, Tailwind CSS |
| **Containerization** | Docker + docker-compose |

---

## 🏃 Quick Start

### Option 1 — Docker (Recommended)

```bash
# Clone and enter project
cd task

# Copy env files
cp backend/.env.example backend/.env

# Start all 4 services (MongoDB, Redis, Backend, Frontend)
docker-compose up --build
```

**Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/health

### Option 2 — Manual Setup

**Prerequisites:** Node.js 20+, MongoDB, Redis

**Backend:**
```bash
cd backend
npm install
cp .env.example .env       # Fill in your values
npm run dev                # Starts on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
# .env.local already has: NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                # Starts on http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | — |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CORS_ORIGIN` | Allowed frontend URL | `http://localhost:3000` |
| `LOG_LEVEL` | Winston log level | `debug` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | ❌ | Register new user |
| `POST` | `/api/v1/auth/login` | ❌ | Login & get JWT |
| `GET` | `/api/v1/auth/me` | ✅ | Get current user |

### Tasks (CRUD)
| Method | Endpoint | Auth | Cache | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/v1/tasks` | ✅ | 60s | List tasks (own/all) |
| `POST` | `/api/v1/tasks` | ✅ | — | Create task |
| `GET` | `/api/v1/tasks/:id` | ✅ | 60s | Get task by ID |
| `PUT` | `/api/v1/tasks/:id` | ✅ | invalidates | Update task |
| `DELETE` | `/api/v1/tasks/:id` | ✅ | invalidates | Delete task |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/users` | List all users |
| `DELETE` | `/api/v1/admin/users/:id` | Delete user + their tasks |
| `GET` | `/api/v1/admin/stats` | Platform statistics |

---

## 🔒 Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT**: Short-lived access tokens (15m)
- **RBAC**: `user` vs `admin` role enforcement
- **Rate limiting**: 100 req/15min global, 10 req/15min on auth routes
- **Helmet**: Security headers
- **CORS**: Restricted to configured origin
- **Input sanitization**: Zod schema validation on all inputs
- **Request size limit**: 10kb body limit

---

## 📚 API Documentation

Interactive Swagger UI available at: **http://localhost:5000/api-docs**

Raw OpenAPI JSON spec: **http://localhost:5000/api-docs.json**

---

## 🗄️ Database Schema

### User
```
{ name, email (unique), password (hashed), role: 'user'|'admin', timestamps }
```

### Task
```
{ title, description, status: 'pending'|'in-progress'|'completed',
  priority: 'low'|'medium'|'high', dueDate, createdBy (ref: User), timestamps }
Indexes: { createdBy, status }, { createdBy, createdAt }
```

---

## 📁 Project Structure

```
task/
├── backend/             # Express + TypeScript API
│   ├── src/
│   │   ├── config/      # DB, Redis, JWT, Swagger, Logger
│   │   ├── controllers/ # Auth, Task, Admin handlers
│   │   ├── middleware/  # Auth, RBAC, Validate, Cache, Error
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/v1/   # Versioned routes
│   │   ├── utils/       # AppError, response helpers
│   │   └── validators/  # Zod schemas
│   ├── logs/            # Winston log files (auto-created)
│   └── Dockerfile
├── frontend/            # Next.js + React + Tailwind CSS
│   ├── src/
│   │   ├── app/         # App Router (login, register, dashboard)
│   │   ├── components/  # Navbar, TaskCard, TaskModal
│   │   ├── context/     # AuthContext
│   │   └── lib/         # API client (axios)
│   └── Dockerfile
├── docker-compose.yml   # MongoDB + Redis + Backend + Frontend
├── SCALABILITY.md
└── README.md
```
