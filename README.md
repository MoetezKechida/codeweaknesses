# CodeWeaknesses — Competitive Programming Judge Platform

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="NestJS Logo" />
</p>

<p align="center">
  A full-featured, production-ready online judge backend built with NestJS, featuring real-time Docker-based code execution, live leaderboards, GraphQL standings, webhook notifications, and SSE-powered submission streams.
</p>

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-sandbox-2496ED?logo=docker" />
  <img alt="BullMQ" src="https://img.shields.io/badge/BullMQ-Redis-DC382D?logo=redis" />
  <img alt="GraphQL" src="https://img.shields.io/badge/GraphQL-Yoga-E10098?logo=graphql" />
  <img alt="WebSocket" src="https://img.shields.io/badge/WebSocket-Socket.IO-010101?logo=socketdotio" />
  <img alt="License" src="https://img.shields.io/badge/license-UNLICENSED-lightgrey" />
</p>

---

## Overview

**CodeWeaknesses** is a competitive programming platform backend where users participate in timed coding contests, submit solutions in multiple programming languages, and receive real-time feedback on their submissions. Judges run code inside isolated Docker containers, results are streamed live to clients via Server-Sent Events (SSE), leaderboards update in real time via WebSockets, and contest completion triggers webhook notifications to registered subscribers.

---

## Key Features

| Feature | Details |
|---|---|
| **Multi-language Code Execution** | JavaScript, Python 3, C, C++, Java, Bash — each in an isolated Docker container |
| **Sandboxed Judging** | Memory limits, CPU quotas, network isolation, read-only filesystem per submission |
| **Async Job Queue** | BullMQ + Redis: submissions processed asynchronously with retry logic |
| **Live SSE Stream** | Per-submission Server-Sent Events push each test result the moment it finishes |
| **Live Leaderboard** | Socket.IO WebSocket gateway broadcasts ICPC-style rankings after every accepted submission |
| **GraphQL API** | GraphQL Yoga: contest standings, personal submission history, full submission detail |
| **REST API** | Full CRUD for contests, problems, test cases, users, submissions, and webhooks |
| **Webhook Notifications** | HMAC-SHA256 signed POST requests on contest completion, with exponential-backoff retry |
| **Role-based Access Control** | Three roles — `admin`, `editor`, `user` — enforced via JWT + NestJS guards |
| **Auto Contest Expiry** | Background polling automatically closes contests past their end time |
| **Hidden Test Cases** | Editors mark test cases hidden; outputs are filtered from non-admin responses |
| **Soft Delete & Restore** | Contests and problems support soft-delete with restore capability |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser / App)                      │
│                                                                       │
│   REST API ──► HTTP/HTTPS    GraphQL ──► /graphql    WS ──► /leaderboard │
│   SSE Stream ──► /sse/submission/:id                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   NestJS App    │
                    │  (port 3000)    │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────────┐
          │                  │                       │
   ┌──────▼──────┐   ┌───────▼────────┐   ┌────────▼────────┐
   │  REST API   │   │  GraphQL API   │   │  WebSocket GW   │
   │  Modules    │   │  (Yoga/Code-   │   │  (Socket.IO     │
   │             │   │   First)       │   │  /leaderboard)  │
   └──────┬──────┘   └───────┬────────┘   └────────┬────────┘
          │                  │                       │
          └──────────────────┼───────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Service Layer  │
                    │  (Business      │
                    │   Logic)        │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌───────▼──────┐  ┌───────▼──────┐
   │  PostgreSQL │   │  Redis       │  │  Docker      │
   │  (TypeORM)  │   │  (BullMQ     │  │  (Judge      │
   │             │   │   Queues)    │  │   Engine)    │
   └─────────────┘   └──────────────┘  └──────────────┘
```

### Request Lifecycle — Submission

```
Client POST /submissions
        │
        ▼
  SubmissionsController
        │  validates JWT, body
        ▼
  SubmissionsService.create()
        │  validates contest window, problem ownership
        │  saves Submission (status=PENDING)
        │
        ▼
  QueueService.enqueueSubmission()   ──► Redis / BullMQ "submissions" queue
        │
        ▼ (async worker picks up job)
  SubmissionProcessor.processSubmission()
        │
        ├─ fetch TestCases from DB
        ├─ for each TestCase:
        │       JudgeEngineService.executeCode()  ──► Docker container
        │       compare output
        │       save TestResult
        │       SSE push → client (live per-test result)
        │
        ├─ calculate score & final status
        ├─ update Submission in DB
        ├─ SSE complete event → client
        └─ LeaderboardGateway.broadcastLeaderboard() ──► Socket.IO room
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [NestJS 11](https://nestjs.com/) |
| **Language** | TypeScript 5.7 |
| **Database** | PostgreSQL 16 / MySQL 8 / SQLite (configurable) |
| **ORM** | TypeORM 1.x |
| **Job Queue** | BullMQ 5 + Redis 7 |
| **Code Execution** | Dockerode (Docker Engine API) |
| **GraphQL** | GraphQL Yoga + `@nestjs/graphql` (code-first) |
| **WebSockets** | Socket.IO 4 via `@nestjs/websockets` |
| **SSE** | NestJS `@Sse` + RxJS Subjects |
| **Authentication** | Passport.js + JWT (passport-jwt) |
| **Password Hashing** | bcrypt |
| **Validation** | class-validator + class-transformer |
| **Events** | `@nestjs/event-emitter` (EventEmitter2) |
| **HTTP Client** | Native `fetch` (Node 18+) |
| **Testing** | Jest 30 + Supertest |
| **Containerization** | Docker Compose |

---

## Module Breakdown

### `AuthModule`
Handles registration, login, and JWT strategy.

- `POST /auth/register` — public self-registration (role: `user`)
- `POST /auth/login` — returns `access_token`
- `JwtStrategy` — validates Bearer tokens and populates `req.user`
- `RolesGuard` — checks `@Roles()` decorator against JWT payload role

### `UserModule`
User management with seeded superadmin on startup.

- Auto-creates `superadmin / admin123` if no admin exists
- `GET /user`, `GET /user/:id`, `PATCH /user/:id`, `DELETE /user/:id`
- `POST /user` — admin-only: creates privileged users (editor/admin)

### `ContestModule`
Full contest lifecycle management.

- CRUD operations with soft-delete/restore
- `PATCH /contests/finish/:id` — manually closes a contest
- `ContestService.onModuleInit()` — starts a 60-second background interval that auto-closes expired contests
- Emits `contest.finished` event consumed by the webhook listener

### `ProblemModule`
Problem and test case management.

- CRUD for problems (tied to a contest)
- `POST /problem/:id/testcases` — add test case (supports `isHidden` flag)
- `GET /problem/:id/testcases/visible` — public endpoint returning only visible test cases
- `GET /problem/:id/testcases` — admin/editor endpoint returning all test cases

### `SubmissionsModule`
Core judging pipeline.

- `POST /submissions` — validates contest window, enqueues job
- `GET /submissions/:id` — returns submission with sanitized test results (hidden outputs masked)
- `GET /submissions/user/history` — personal history
- `GET /submissions/contest/:id` — all submissions for a contest
- `GET /submissions/problem/:id` — all submissions for a problem

### `QueueModule`
BullMQ abstraction layer.

- Manages `submissions` and `webhooks` named queues
- `QueueService.registerProcessor()` — called on module init to wire workers
- Exponential backoff job retry (3 attempts, 2s base delay)
- Configurable worker concurrency per queue via env vars

### `SseModule`
Server-Sent Events for live submission feedback.

- `GET /sse/submission/:id` — protected endpoint, streams events
- `SubmissionSseService` — manages per-submission `Subject<MessageEvent>` with ref-counting
- Events: `test_result`, `submission.completed`, `submission.error`
- Late-join support: replays all results if submission already finished
- Hidden test case outputs filtered for non-admin callers

### `LeaderboardModule`
Real-time WebSocket leaderboard.

- `LeaderboardGateway` — Socket.IO namespace `/leaderboard`
- Clients emit `joinContest` / `leaveContest` to manage room subscriptions
- Server broadcasts `leaderboard:update` after every submission completes
- ICPC-style scoring: `penalty = timeMinutes + 20 × wrong_attempts`
- Skips broadcast when no clients are watching (avoids unnecessary DB queries)
- JWT authentication on connect (anonymous spectators allowed in read-only)

### `GraphqlStandingsModule`
GraphQL API (code-first with GraphQL Yoga).

- `contestStandings(contestId)` — public ranked leaderboard with per-problem breakdown
- `mySubmissions(contestId)` — authenticated user's history
- `submissionDetail(id)` — full detail with test results; hidden outputs filtered for non-admins

### `WebhooksModule`
Webhook subscriptions and delivery.

- `POST /webhooks` — register a URL (optionally scoped to a contest)
- `GET /webhooks`, `GET /webhooks/:id` — list/inspect subscriptions
- On `contest.finished` event: fans out to all active subscribers
- HMAC-SHA256 signature via `x-signature-256` header
- Delivery retry via BullMQ: up to 3 attempts with exponential backoff (1s → 2s → 4s, capped at 15s)
- Full delivery audit trail in `webhook_deliveries` table

### `CommunModule`
Shared infrastructure.

- `TimestampEntity` — abstract base with `id` (UUID), `createdAt`, `updatedAt`, `deletedAt`
- `BaseService<T>` — generic CRUD service with soft-delete and restore

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register (role: user) |
| POST | `/auth/login` | None | Login → JWT |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/user` | Admin | Create editor/admin |
| GET | `/user` | None | List users |
| GET | `/user/:id` | None | Get user |
| PATCH | `/user/:id` | None | Update user |
| DELETE | `/user/:id` | Admin | Delete user |

### Contests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/contests` | None | List all contests |
| POST | `/contests` | Editor+ | Create contest |
| PATCH | `/contests/:id` | Editor+ | Update contest |
| PATCH | `/contests/finish/:id` | Editor+ | Manually finish |
| DELETE | `/contests/:id` | Editor+ | Soft-delete |
| PATCH | `/contests/restore/:id` | Editor+ | Restore |

### Problems

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/problem` | None | List all problems |
| GET | `/problem/:id` | None | Get problem |
| GET | `/problem/byContest/:id` | None | Problems by contest |
| POST | `/problem` | Editor+ | Create problem |
| PATCH | `/problem/:id` | Editor+ | Update problem |
| DELETE | `/problem/:id` | Editor+ | Soft-delete |
| PATCH | `/problem/restore/:id` | Editor+ | Restore |
| POST | `/problem/:id/testcases` | Editor+ | Add test case |
| GET | `/problem/:id/testcases` | Editor+ | All test cases |
| GET | `/problem/:id/testcases/visible` | None | Visible test cases |
| DELETE | `/problem/:id/testcases/:tcId` | Editor+ | Delete test case |

### Submissions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | User | Submit code |
| GET | `/submissions/:id` | User | Get submission |
| GET | `/submissions/user/history` | User | Own history |
| GET | `/submissions/problem/:id` | User | By problem |
| GET | `/submissions/contest/:id` | User | By contest |

### SSE

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sse/submission/:id` | User (owner/admin) | Live result stream |

### Webhooks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/webhooks` | None | Subscribe |
| GET | `/webhooks` | None | List subscriptions |
| GET | `/webhooks/:id` | None | Get subscription |

### GraphQL (`/graphql`)

```graphql
query ContestStandings($contestId: ID!) {
  contestStandings(contestId: $contestId) {
    rank
    userId
    userName
    totalScore
    problemsSolved
    lastAcceptedAt
    problemBreakdowns {
      problemId
      problemTitle
      bestScore
      attempts
      bestSubmission { id status score language submittedAt executionTime }
    }
  }
}

query MySubmissions($contestId: ID!) {
  mySubmissions(contestId: $contestId) {
    id language status score submittedAt completedAt executionTime
  }
}

query SubmissionDetail($id: ID!) {
  submissionDetail(id: $id) {
    id language status score code executionTime memoryUsed
    testResults {
      id testCaseId passed isHidden output expectedOutput error executionTime
    }
  }
}
```

---

## Real-Time Systems

### Server-Sent Events (SSE)

Clients connect to `/sse/submission/:id` (Bearer token required). The stream emits:

```json
// Per test case (emitted immediately after execution)
{ "type": "test_result", "submissionId": "...", "testCaseIndex": 0,
  "verdict": "pass|fail|tle|mle|error", "executionMs": 42,
  "isHidden": false, "output": "Hello World", "expectedOutput": "Hello World" }

// Final event
{ "type": "submission.completed", "finalVerdict": "accepted",
  "score": 100, "totalExecutionMs": 210, "passedCount": 5, "totalCount": 5 }

// On error
{ "type": "submission.error", "message": "Internal error" }
```

### WebSocket Leaderboard

Connect to `ws://host:3000/leaderboard` (Socket.IO).

```js
// Client → Server
socket.emit('joinContest',  { contestId: 'uuid' });
socket.emit('leaveContest', { contestId: 'uuid' });

// Server → Client (on join and after every accepted submission)
socket.on('leaderboard:update', (payload) => {
  // { contestId, generatedAt, entries: [ { rank, userId, userName,
  //   solved, totalPenalty, problems: { [problemId]: { solved, attempts,
  //   acceptedAt, timeMinutes, penaltyMinutes } } } ] }
});

socket.on('leaderboard:error', ({ message }) => { /* ... */ });
```

---

## Judge Engine

Code execution is handled by `JudgeEngineService` using the Docker Engine API (`dockerode`).

### Language → Docker Image

| Language | Image |
|---|---|
| JavaScript | `node:22-alpine` |
| Python / Python3 | `python:3.11-alpine` |
| C / C++ | `gcc:latest` |
| Java | `openjdk:21-jdk-alpine` |
| Bash | `alpine:latest` |

### Sandbox Constraints (per container)

| Constraint | Default |
|---|---|
| Memory limit | 256 MB (`MEMORY_LIMIT` env) |
| Memory swap | Same as memory (no swap) |
| CPU quota | 100,000 µs / 100,000 µs period (1 core) |
| Network | Disabled |
| Filesystem | Read-only root |
| Timeout | 5,000 ms (`SUBMISSION_TIMEOUT` env) |

### Execution Flow

1. Container created with code injected via `CODE` env var, input via `INPUT` env var
2. Stream attached *before* start (captures fast completions)
3. Race between `readStream` and `timeoutPromise` — TLE kills the container immediately
4. Memory stats collected post-execution to detect MLE
5. Output normalized (trim, split lines, re-join) before comparison
6. Container force-removed in `finally` block (no orphaned containers)

---

## Database Schema

```
users
  id (UUID PK), name (unique), passwordHash, role (enum), createdAt, updatedAt, deletedAt

contests
  id (UUID PK), title, startTime, endTime, finishedAt (nullable),
  createdAt, updatedAt, deletedAt

problems
  id (UUID PK), title, description (text), timeLimitMs,
  contestId (FK → contests), createdAt, updatedAt, deletedAt

test_cases
  id (UUID PK), problemId (FK → problems), input (text), expectedOutput (text),
  isHidden (bool, default false), orderIndex (int, default 0),
  createdAt, updatedAt, deletedAt

submissions
  id (UUID PK), code (text), language (enum), status (varchar, default 'pending'),
  userId (FK → users), problemId (FK → problems), contestId,
  submittedAt, startedAt, completedAt, score (int, default 0),
  executionTime (int nullable), memoryUsed (int nullable),
  createdAt, updatedAt, deletedAt

test_results
  id (UUID PK), submissionId (FK → submissions), testCaseId,
  passed (bool), isHidden (bool), output (text nullable),
  expectedOutput (text nullable), error (text nullable),
  executionTime (int nullable), memoryUsed (int nullable),
  createdAt, updatedAt, deletedAt

webhook_subscriptions
  id (UUID PK), targetUrl, secret (text nullable), contestId (UUID nullable),
  active (bool, default true), createdAt, updatedAt, deletedAt

webhook_deliveries
  id (UUID PK), subscriptionId (FK → webhook_subscriptions),
  status (enum: pending/sent/failed), attempts (int), lastAttemptAt (nullable),
  responseCode (int nullable), payload (text),
  createdAt, updatedAt, deletedAt
```

---

## Authentication & Authorization

### Roles

| Role | Capabilities |
|---|---|
| `admin` | Full access — all CRUD, user management, view hidden test data |
| `editor` | Manage contests, problems, and test cases |
| `user` | Submit code, view own submissions, view public data |

### JWT Payload

```json
{ "sub": "<userId>", "name": "<username>", "role": "admin|editor|user" }
```

Default expiry: `24h`. Secret configured via `JWT_SECRET` env var (hardcoded fallback for dev — **change in production**).

---

## Webhook System

### Subscription

```json
POST /webhooks
{
  "targetUrl": "https://your-server.com/hook",
  "secret": "optional-hmac-secret",
  "contestId": "optional-uuid-to-scope-to-one-contest",
  "active": true
}
```

If `secret` is omitted, a 32-byte random hex secret is generated automatically.

### Delivery Payload

```json
{
  "contestId": "uuid",
  "contestTitle": "Summer 2026",
  "winner": {
    "name": "alice",
    "score": 100,
    "solveTimeSeconds": 1234
  }
}
```

### Signature Verification

```js
const crypto = require('crypto');
const expected = 'sha256=' +
  crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
const received = req.headers['x-signature-256'];
// Use timingSafeEqual to compare
```

### Retry Schedule

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 1,000 ms |
| 3 | 2,000 ms |
| After 3 failures | Marked `FAILED`, no further retries |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker & Docker Compose
- npm

### 1. Clone & Install

```bash
git clone https://github.com/your-org/codeweaknesses.git
cd codeweaknesses
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env — set DB_TYPE, Redis, JWT_SECRET, etc.
```

### 3. Start Infrastructure

```bash
docker compose up -d postgres redis
# PostgreSQL on :5433, Redis on :6380
```

### 4. Start Application

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`.  
GraphQL playground: `http://localhost:3000/graphql`  
WebSocket leaderboard: `ws://localhost:3000/leaderboard`

### 5. Default Admin Credentials

On first boot, a superadmin is seeded automatically:

```
username: superadmin
password: admin123
```

---

## Environment Variables

```ini
# Database (postgres | mysql | sqlite)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=codeweaknesses

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
SUBMISSION_WORKER_CONCURRENCY=2

# Judge
SUBMISSION_TIMEOUT=5000        # ms per test case
MEMORY_LIMIT=268435456         # bytes (256 MB)

# Auth
JWT_SECRET=change_me_in_production
JWT_EXPIRATION=24h
```

---

## Docker Compose

The provided `docker-compose.yml` starts three services:

| Service | Image | Exposed Port |
|---|---|---|
| `postgres` | `postgres:16-alpine` | `5433:5432` |
| `mysql` | `mysql:8.0` | `3306:3306` |
| `redis` | `redis:7-alpine` | `6380:6379` |

All services include health checks. Data is persisted via named volumes (`postgres_data`, `mysql_data`, `redis_data`).

```bash
# Start all infrastructure
docker compose up -d

# Start only what you need
docker compose up -d postgres redis
```

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```
