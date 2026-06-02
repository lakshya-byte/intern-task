# Scalability Strategy — TaskFlow

## Current Architecture

```
Client → Next.js Frontend → Express Backend → MongoDB + Redis
```

## 1. Horizontal Scaling

**Problem:** Single server becomes a bottleneck under high load.

**Solution:**
- Run multiple backend instances with **PM2 cluster mode** (`pm2 start server.js -i max`)
- Stateless JWT design allows any instance to handle any request
- Place a **load balancer** (Nginx, AWS ALB) in front:

```
                    ┌─────────────┐
Clients ──► Nginx ──► Backend #1  │
           (LB)    ├─────────────┤
                   ► Backend #2  │  All connect to
                   ├─────────────┤  same MongoDB + Redis
                   ► Backend #3  │
                    └─────────────┘
```

## 2. Redis Caching (Already Implemented)

**Cache-aside pattern** with TTL-based expiry:

```
GET /api/v1/tasks
  → Check Redis cache (key: cache:tasks:{userId}:{url})
  → HIT: Return cached JSON instantly (X-Cache: HIT header)
  → MISS: Query MongoDB, cache result for 60s, return (X-Cache: MISS)

POST/PUT/DELETE /api/v1/tasks/:id
  → invalidateCache('cache:tasks:{userId}:*') — wipes user's task cache
```

**Benefits:** Reduces MongoDB reads by ~80% for repeated GET requests.

**Next steps:** Cache warming, distributed cache invalidation with Redis pub/sub.

## 3. Database Optimization

**MongoDB Indexes (already created):**
```js
TaskSchema.index({ createdBy: 1, status: 1 });     // Filter by user + status
TaskSchema.index({ createdBy: 1, createdAt: -1 }); // Sort by date per user
UserSchema: email (unique index)
```

**At scale:**
- **Connection pooling**: Mongoose manages a pool (default 5, tune via `poolSize`)
- **MongoDB Atlas**: Auto-scaling clusters, automated backups
- **Sharding**: Shard `tasks` collection on `createdBy` for horizontal DB scaling
- **Read replicas**: Route analytics queries to secondary nodes

## 4. Microservices Decomposition (Future)

When the monolith grows, split into:

```
API Gateway (Kong / Nginx)
    ├── auth-service          (User registration, login, JWT)
    ├── task-service          (Task CRUD, ownership)
    ├── notification-service  (Email alerts for due dates)
    └── admin-service         (User management, analytics)
```

**Communication:** REST between services, or event-driven with **Apache Kafka** for async workflows (e.g., send email when task is overdue).

## 5. Rate Limiting & DDoS Protection

**Already implemented:**
- `express-rate-limit`: 100 req/15min globally, 10 req/15min on auth endpoints

**At scale:**
- Move rate limiting to **Redis** (`rate-limit-redis` store) so limits are shared across all instances
- Add **Cloudflare** for DDoS mitigation and edge caching of static assets

## 6. Logging & Observability

**Already implemented:**
- **Winston** with daily log rotation → `logs/error-YYYY-MM-DD.log` + `logs/combined-YYYY-MM-DD.log`
- Request ID correlation via UUID middleware
- Structured JSON logs for easy parsing

**At scale:**
- Ship logs to **Elasticsearch + Kibana** (ELK Stack) or **Datadog**
- Metrics: **Prometheus + Grafana** for request rate, error rate, response times
- Tracing: **OpenTelemetry** for distributed request tracing across services

## 7. CI/CD Pipeline

```yaml
# Example GitHub Actions flow
push → lint → test → build Docker image → push to ECR → deploy to ECS/K8s
```

Tools: **GitHub Actions**, **ArgoCD**, **Kubernetes (EKS/GKE)**

## 8. CDN & Asset Optimization

- Next.js static assets served via **Vercel Edge Network** or **CloudFront**
- API responses gzip compressed (`compression` middleware — already added)
- Image optimization via Next.js `<Image>` component

## 9. Session & Token Strategy

**Current:** Short-lived JWT (15m access token) — stateless, scales infinitely.

**Enhancement:** Add refresh token rotation:
- Store refresh tokens in Redis with TTL = 7 days
- On access token expiry, validate refresh token, issue new access token
- On logout, delete refresh token from Redis (instant invalidation)

## 10. Deployment Architecture (Production)

```
                    ┌──────────────────────────────────┐
                    │         AWS / GCP / Azure         │
                    │                                   │
Users → CloudFront → ALB → ECS Fargate (Backend ×3)    │
              │      └───► ECS Fargate (Frontend ×2)    │
              │                  │                      │
              │            MongoDB Atlas (M10+)          │
              │            Redis ElastiCache (r6g)       │
              │            CloudWatch Logs               │
              └──────────────────────────────────────────┘
```

**Estimated capacity:** This architecture handles ~10,000 concurrent users before needing further scaling.
