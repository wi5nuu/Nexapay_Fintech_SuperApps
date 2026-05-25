# NexaPay — FinTech SuperApp

**Next-generation financial super-app platform** — Unified payments, wallets, KYC verification, lending, investment management, fraud detection, and real-time reporting. Built with a microservices architecture, event-driven messaging, and cloud-native deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐                   │
│  │  React Admin  │  │  Vue Portal  │  │  Ionic Mobile    │                   │
│  │  (Dashboard)  │  │  (Web App)   │  │  (iOS/Android)   │                   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘                   │
│         │                 │                    │                             │
├─────────┼─────────────────┼────────────────────┼─────────────────────────────┤
│         │          API GATEWAY (NestJS)        │                             │
│         │    REST + GraphQL + WebSocket        │                             │
│         └─────────────────┬────────────────────┘                             │
│                           │                                                  │
├───────────────────────────┼──────────────────────────────────────────────────┤
│                    SERVICE MESH (gRPC Internal)                              │
│                           │                                                  │
│   ┌──────┐ ┌──────┐ ┌────┴───┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────┐  │
│   │ Auth │ │ KYC  │ │ Wallet │ │ Loan │ │Investmt│ │ Notif│ │ Reporting│  │
│   └──┬───┘ └──┬───┘ └───┬────┘ └──┬───┘ └───┬────┘ └──┬───┘ └────┬─────┘  │
│      │        │         │         │         │         │          │          │
│   ┌──┴────────┴─────────┴─────────┴─────────┴─────────┴──────────┴───┐     │
│   │                    KAFKA EVENT BUS                                │     │
│   └──────────────────────────┬────────────────────────────────────────┘     │
│                              │                                              │
│   ┌──────────────────────────┴────────────────────────────────────────┐     │
│   │                    FRAUD DETECTION ENGINE                         │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │PostgreSQL│ │  MongoDB │ │  MySQL   │ │  Redis   │ │Elasticsearch│       │
│  │ (Primary)│ │ (KYC/Inv)│ │(Reporting)│ │ (Cache)  │ │ (Logs/Search)│     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        INFRASTRUCTURE LAYER                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Docker/K8s│ │ Terraform│ │  Helm    │ │  Istio   │ │  Prometheus│        │
│  │ (Orch)  │ │ (IaC)   │ │(Charts)  │ │(Service  │ │  + Grafana │        │
│  │          │ │          │ │          │ │  Mesh)   │ │ (Monitoring)│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer           | Technology                                                                 |
|-----------------|----------------------------------------------------------------------------|
| **Frontend**    | React 18 (Admin), Vue 3 (Portal), Ionic 7 + Angular (Mobile)              |
| **Backend**     | NestJS (Node 20), Express, TypeScript 5.3, GraphQL (Apollo), gRPC         |
| **Databases**   | PostgreSQL 16 (Primary), MongoDB 7 (Documents), MySQL 8 (Reporting)       |
| **Cache**       | Redis 7 (Caching, Sessions, Rate Limiting, Idempotency)                   |
| **Message Bus** | Apache Kafka + Kafka Connect + Schema Registry                            |
| **Search**      | Elasticsearch 8 (Audit logs, Full-text search)                            |
| **Storage**     | MinIO / S3 (KYC documents, Avatars)                                       |
| **Infrastructure** | Docker, Kubernetes (EKS/GKE), Terraform, Helm, Istio                   |
| **Monitoring**  | Prometheus, Grafana, Sentry, ELK Stack                                    |
| **CI/CD**       | GitHub Actions, ArgoCD, Docker Registry, Semantic Release                 |
| **Security**    | OWASP Top 10, PCI-DSS, JWT (RS256), TOTP 2FA, OAuth 2.0 (Google/Apple)   |
| **Testing**     | Jest, Supertest, TestContainers, Cypress, k6, Playwright                  |

---

## Prerequisites

| Tool          | Version   | Purpose                                   |
|---------------|-----------|-------------------------------------------|
| **Node.js**   | >= 20.0.0 | Runtime                                   |
| **npm**       | >= 10.0.0 | Package manager                           |
| **Docker**    | >= 24.0   | Local development containers              |
| **Docker Compose** | >= 2.24 | Multi-service orchestration             |
| **Kubernetes**| >= 1.28   | Production orchestration (minikube for dev)|
| **kubectl**   | >= 1.28   | K8s CLI                                   |
| **Terraform** | >= 1.7    | Infrastructure as Code                    |
| **Helm**      | >= 3.14   | K8s package manager                       |
| **Nx CLI**    | >= 18.0   | Monorepo build orchestration              |
| **k6**        | >= 0.50   | Load testing                              |
| **Cypress**   | >= 13.0   | E2E testing                               |

---

## Quick Start

```bash
# 1. Clone and install dependencies
git clone https://github.com/nexapay/nexapay.git
cd nexapay
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your secrets

# 3. Start infrastructure (Postgres, Redis, Kafka, MinIO)
docker-compose up -d

# 4. Run database migrations
npm run migration:run

# 5. Start development servers
npm run build
npm run start:dev
```

---

## Project Structure

```
nexapay/
├── apps/
│   ├── api-gateway/          # NestJS API Gateway (REST + GraphQL + WebSocket)
│   ├── react-admin/          # React 18 Admin Dashboard (MUI)
│   ├── vue-portal/           # Vue 3 User Portal (PrimeVue)
│   └── ionic-mobile/         # Ionic 7 + Angular Mobile App
├── services/
│   ├── auth/                 # Authentication & Authorization Service
│   ├── user-kyc/             # User Profile & KYC Verification Service
│   ├── wallet/               # Digital Wallet & Payment Service
│   ├── loan/                 # Loan Origination & Management Service
│   ├── investment/           # Investment & Portfolio Service
│   ├── notification/         # Multi-channel Notification Service
│   ├── reporting/            # Business Intelligence & Reporting Service
│   ├── fraud-detection/      # Real-time Fraud Detection Engine
│   └── kafka-connect/        # Kafka Connector Configuration
├── shared/
│   ├── constants/            # Shared constants & enums
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Shared utility functions
├── proto/                    # Protocol Buffer definitions (gRPC)
├── deploy/
│   ├── terraform/            # Infrastructure as Code (AWS/GCP)
│   ├── kubernetes/           # Kubernetes manifests & Helm charts
│   └── scripts/              # Deployment & CI/CD scripts
├── tests/
│   ├── e2e/                  # Cypress end-to-end tests
│   │   ├── cypress/
│   │   │   ├── e2e/          # Test specifications
│   │   │   ├── support/      # Commands, hooks, utilities
│   │   │   └── fixtures/     # Test fixtures
│   │   └── cypress.config.ts
│   ├── integration/          # Jest + Supertest integration tests
│   │   ├── jest-e2e.json
│   │   ├── test-setup.ts     # TestContainers bootstrap
│   │   └── utils/            # Test helpers (DB, auth)
│   └── load/                 # k6 performance & stress tests
├── .eslintrc.js              # ESLint config (TypeScript + security)
├── .env.example              # Environment variable template
├── docker-compose.yml        # Local development stack
├── tsconfig.base.json        # Base TypeScript config
└── package.json              # Monorepo root package
```

---

## Modules

### 1. Auth Service
- **Stack**: NestJS, PostgreSQL, Redis, JWT (RS256), TOTP
- **Features**: Registration, login (email/password + OAuth), email verification, passwordless magic links, 2FA (TOTP), refresh tokens, session management, RBAC, permission scoping, rate limiting (token bucket)
- **APIs**: REST (`/auth/*`), gRPC (`AuthService`)

### 2. User & KYC Service
- **Stack**: NestJS, PostgreSQL, MongoDB, MinIO/S3, OCR pipeline
- **Features**: User profiles, KYC tiers (Basic/Enhanced/Corporate), document upload (passport, driver's license, utility bill, selfie), liveness detection, AML screening, sanction list checks (OFAC), PEP screening, address verification, identity verification
- **APIs**: REST (`/kyc/*`), GraphQL (`UserResolver`)

### 3. Wallet Service
- **Stack**: NestJS, PostgreSQL, Redis, gRPC
- **Features**: Multi-currency wallets (USD, EUR, GBP, NGN, KES), P2P transfers, top-up (card, bank transfer, crypto), withdrawals, idempotency (Idempotency-Key), transaction history, balance caching, daily/monthly limits, virtual accounts, scheduled payments, QR code payments
- **APIs**: REST (`/wallet/*`), gRPC (`WalletService`)

### 4. Loan Service
- **Stack**: NestJS, PostgreSQL, Redis, Credit scoring engine
- **Features**: Loan products (personal, business, payday), loan origination, credit assessment, amortization schedules, repayment tracking (auto-debit, manual), late fee calculation, loan restructuring, credit limit management, collateral management
- **APIs**: REST (`/loans/*`), GraphQL (`LoanResolver`)

### 5. Investment Service
- **Stack**: NestJS, MongoDB, Redis, Market data provider
- **Features**: Portfolio management, mutual funds, fixed deposits, treasury bills, stocks (via broker API), investment plans, auto-invest, dividend tracking, performance reports, risk profiling
- **APIs**: REST (`/investments/*`), GraphQL (`InvestmentResolver`)

### 6. Notification Service
- **Stack**: NestJS, MongoDB, Redis, SendGrid, Twilio, FCM
- **Features**: Multi-channel (email, SMS, push, in-app), templates (Handlebars), delivery tracking, batching, rate limiting, unsubscribe management, scheduled notifications, webhook delivery
- **APIs**: REST (`/notifications/*`), Kafka consumer

### 7. Reporting Service
- **Stack**: NestJS, MySQL, Elasticsearch, Apache Druid
- **Features**: Business reports (daily/weekly/monthly), transaction analytics, user growth metrics, KPI dashboards, audit trails, data export (CSV, PDF, Excel), scheduled report generation, custom report builder
- **APIs**: REST (`/reports/*`), GraphQL (`ReportResolver`)

### 8. Fraud Detection Service
- **Stack**: NestJS, Redis, Machine learning models
- **Features**: Real-time transaction scoring, rule-based engine, velocity checks, device fingerprinting, geolocation analysis, behavioral biometrics, anomaly detection, blacklist/whitelist management, ML model serving (ONNX), case management
- **APIs**: gRPC (`FraudService`), Kafka producer/consumer

### 9. API Gateway
- **Stack**: NestJS, GraphQL (Apollo Federation), WebSocket, gRPC client
- **Features**: Unified REST + GraphQL + WebSocket interface, rate limiting, IP whitelisting, request validation, response transformation, API versioning, circuit breaker, service discovery, load balancing, request logging, CORS, CSRF protection, API key management for third-party developers
- **Port**: 3000

### 10. Kafka Connect
- **Stack**: Kafka Connect, Debezium, S3 Sink, Elasticsearch Sink
- **Features**: CDC from PostgreSQL (Debezium), sink connectors to Elasticsearch (for search), MinIO/S3 (for backup), data pipeline monitoring, schema evolution, dead letter queue

---

## API Documentation

| Protocol    | URL                        | Documentation                    |
|-------------|----------------------------|----------------------------------|
| **REST**    | `http://localhost:3000/api`        | Swagger: `/api/docs`        |
| **GraphQL** | `http://localhost:3000/graphql`    | Playground: `/graphql`       |
| **gRPC**    | `localhost:50051`                  | Reflection: `grpcurl`        |
| **WebSocket**| `ws://localhost:3000`             | Events: `/events`            |

---

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:

| Variable                    | Description                          |
|-----------------------------|--------------------------------------|
| `JWT_ACCESS_SECRET`         | JWT signing key (min 32 chars)       |
| `JWT_REFRESH_SECRET`        | Refresh token signing key            |
| `ENCRYPTION_KEY`            | AES-256-GCM encryption key           |
| `SENDGRID_API_KEY`          | Email delivery                       |
| `TWILIO_AUTH_TOKEN`         | SMS delivery                         |
| `AWS_S3_ACCESS_KEY_ID`     | Document storage                     |
| `KAFKA_BROKERS`             | Kafka cluster connection             |
| `SENTRY_DSN`                | Error tracking                       |

---

## Docker Development

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres redis kafka

# View logs
docker-compose logs -f api-gateway

# Rebuild
docker-compose build api-gateway

# Run migrations
docker-compose exec api-gateway npm run migration:run

# Execute command in container
docker-compose exec api-gateway sh

# Stop all
docker-compose down -v
```

### Docker Compose Services

| Service            | Image                                      | Ports                          |
|--------------------|--------------------------------------------|--------------------------------|
| `postgres`         | postgres:16-alpine                         | 5432                           |
| `redis`            | redis:7-alpine                             | 6379                           |
| `kafka`            | confluentinc/cp-kafka:7.5.0                | 9092                           |
| `zookeeper`        | confluentinc/cp-zookeeper:7.5.0            | 2181                           |
| `minio`            | minio/minio:latest                         | 9000, 9001                     |
| `elasticsearch`    | elasticsearch:8.11.0                       | 9200, 9300                     |
| `mongo`            | mongo:7                                    | 27017                          |
| `mysql`            | mysql:8                                    | 3306                           |

---

## Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace nexapay

# Deploy infrastructure
kubectl apply -f deploy/kubernetes/infrastructure/

# Deploy services
kubectl apply -f deploy/kubernetes/services/

# Deploy monitoring
kubectl apply -f deploy/kubernetes/monitoring/

# Check status
kubectl get all -n nexapay

# Scale a service
kubectl scale deployment api-gateway -n nexapay --replicas=5

# Rolling update
kubectl set image deployment/api-gateway api-gateway=nexapay/api-gateway:latest -n nexapay

# View logs
kubectl logs -f deployment/api-gateway -n nexapay

# Port forward
kubectl port-forward service/api-gateway 3000:3000 -n nexapay
```

### Helm Charts

```bash
# Install release
helm install nexapay ./deploy/kubernetes/charts/nexapay --namespace nexapay

# Upgrade
helm upgrade nexapay ./deploy/kubernetes/charts/nexapay --namespace nexapay

# Rollback
helm rollback nexapay 1 --namespace nexapay
```

---

## CI/CD Pipeline

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │ -> │   Lint    │ -> │   Unit    │ -> │  Build   │ -> │  Deploy  │
│  Push    │    │  + Type   │    │   Tests   │    │  Docker  │    │   (Dev)  │
└──────────┘    └───────────┘    └───────────┘    └──────────┘    └──────────┘
                                                      │
                                                      v
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│  Deploy  │ <- │  E2E      │ <- │  Integ.   │ <- │ Staging  │ <- │  Image   │
│  (Prod)  │    │  Tests    │    │  Tests    │    │  Deploy  │    │  Tagged  │
└──────────┘    └───────────┘    └───────────┘    └──────────┘    └──────────┘
     │
     v
┌──────────┐    ┌───────────┐    ┌───────────┐
│  Smoke   │ -> │  Load     │ -> │  Health   │
│  Tests   │    │  Tests    │    │  Checks   │
└──────────┘    └───────────┘    └───────────┘
```

- **Triggers**: Push to `main`, `develop`, `release/*`, PRs
- **PR Pipeline**: Lint → Type Check → Unit Tests (parallel, <5 min)
- **Merge Pipeline**: Build → Integration Tests → E2E Tests → Security Scan
- **Release Pipeline**: Load Tests → Staging Deploy → Smoke Tests → Production Deploy (ArgoCD)
- **Tools**: GitHub Actions, ArgoCD, Docker Registry, SonarQube, Snyk

---

## Security Considerations

### OWASP Top 10
- **Broken Access Control**: RBAC with permission scoping, endpoint-level guards
- **Cryptographic Failures**: AES-256-GCM at rest, TLS 1.3 in transit, RS256 JWT, bcrypt for passwords
- **Injection**: Parameterized queries (Prisma/TypeORM), input validation (class-validator), NoSQL injection prevention
- **Insecure Design**: Rate limiting, idempotency, circuit breakers, bulkheads
- **Security Misconfiguration**: Centralized config, secret management, Helm values validation
- **Vulnerable Components**: Dependabot, Snyk, `npm audit` in CI, SBOM generation
- **Auth Failures**: TOTP 2FA, OAuth 2.0, session rotation, device management
- **Data Integrity**: Idempotency keys, event sourcing, audit trails, immutable logs
- **Logging & Monitoring**: ELK stack, Sentry, Prometheus alerts, structured logging
- **SSRF**: URL allowlisting, internal network isolation, service mesh policies

### PCI-DSS Compliance
- Card data never stored (tokenization via Vault)
- All payment traffic encrypted (TLS 1.3)
- Audit trails for all financial transactions
- Role-based access with quarterly reviews
- Annual penetration testing and vulnerability scans

### Encryption
| Data State   | Mechanism              | Key Management       |
|-------------|------------------------|----------------------|
| **At Rest** | AES-256-GCM (DB level) | Vault + KMS rotation |
| **In Transit** | TLS 1.3 (mTLS for gRPC) | Istio + cert-manager |
| **Secrets** | HashiCorp Vault        | Automated rotation   |

### Authentication
- Multi-factor: Password + TOTP / SMS / Biometric
- OAuth 2.0 providers: Google, Apple
- JWT with RS256, 15 min access tokens, 7 day refresh tokens
- Session binding: Device fingerprint + IP geolocation
- Rate limiting: 5 login attempts/min per IP, account lockout after 10

---

## Testing Guide

### Unit Tests (Jest)
```bash
npm test                          # All unit tests
npm test -- --testPathPattern=auth  # Single service
npm run test:coverage             # With coverage report
```

### Integration Tests (Jest + TestContainers)
```bash
# Requires Docker (auto-starts Postgres, Redis, Kafka containers)
npm run test:e2e                  # All integration tests
npm run test:e2e -- --grep "wallet"  # Filter by pattern
```

TestContainers automatically:
- Spin up PostgreSQL 16, Redis 7, Kafka + Zookeeper
- Create test databases with migrations
- Generate `.env.test` with dynamic connection strings
- Tear down all containers after completion

### E2E Tests (Cypress)

```bash
# Open Cypress Test Runner
cd tests/e2e
npx cypress open

# Run headless
npx cypress run

# Run specific spec
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Run with environment
CYPRESS_BASE_URL=http://staging.nexapay.dev npx cypress run
```

### Load Tests (k6)

```bash
# Simple auth load test
k6 run tests/load/auth-load.js

# Wallet load test with custom URL
k6 run -e BASE_URL=http://staging.nexapay.dev tests/load/wallet-load.js

# Payment stress test with high VUs
k6 run tests/load/payment-stress.js

# Run all scenarios (sequential)
k6 run tests/load/scenarios.js

# Output to JSON
k6 run --out json=results.json tests/load/auth-load.js

# Output to InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6 tests/load/scenarios.js
```

### Test Data

```bash
# Seed test users
npm run test:seed

# Generate test transactions
npm run test:seed:transactions -- --count 1000

# Cleanup test data
npm run test:cleanup
```

---

## Performance Guidelines

### Targets
- **API Latency**: p95 < 500ms (auth), p95 < 800ms (wallet), p95 < 1000ms (loans)
- **Throughput**: 2000 req/s per service instance
- **Availability**: 99.99% uptime (52 min/year max)
- **DB Queries**: < 50ms p95, indexed queries only
- **Cache Hit Rate**: > 90% for wallet balances, session data

### Optimization Strategies
- Redis caching with TTL (5 min for balances, 15 min for user profiles)
- Database indexing on all foreign keys and query patterns
- Read replicas for reporting queries
- Connection pooling (pgBouncer for Postgres)
- Response pagination (cursor-based for transactions, offset for lists)
- Compression (Brotli for API responses)
- Batch processing for notifications and report generation
- Lazy loading for images and heavy components
- Code splitting (React.lazy, dynamic imports)

### Monitoring
- Prometheus metrics on all endpoints
- Grafana dashboards for latency, throughput, error rates, resource usage
- Sentry for error tracking with context
- Custom dashboards per team
- SLA alerts via PagerDuty

---

## Contributing

1. **Branch naming**: `feat/WAL-123-description`, `fix/AUTH-45-description`, `chore/description`
2. **Commit messages**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
3. **PR requirements**:
   - Linear ticket reference in title
   - Description of changes and testing performed
   - Screenshots for UI changes
   - At least 1 reviewer approval
   - All CI checks passing (lint, type, test, build)
4. **Code review**:
   - Security review for auth, payments, KYC changes
   - Performance review for any new DB queries or API endpoints
   - Architecture review for new services or significant changes
5. **Before merging**:
   - Rebase onto target branch
   - Squash commits
   - Update documentation if applicable
6. **Post-merge**:
   - Monitor deployment in staging
   - Verify health checks pass
   - Run smoke tests against staging

---

## License

**NexaPay** — Proprietary software. All rights reserved.

---

*Built with TypeScript, NestJS, and  by Wisnu Alfian Nur Ashar.*
