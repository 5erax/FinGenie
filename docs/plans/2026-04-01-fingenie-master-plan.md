# Plan: FinGenie Web + Mobile Delivery

> **For Claude:** REQUIRED SUB-SKILL: Use skill({ name: "executing-plans" }) to implement this plan task-by-task.

**Goal:** Xây dựng và triển khai FinGenie production-ready trên cả Web (Landing + Admin) và Mobile (Expo), có AI coaching, auth Google/Phone OTP, và thanh toán PayOS.

**Architecture:** Modular monolith với NestJS API, Next.js web, Expo mobile, PostgreSQL + Prisma, Firebase Auth, Gemini, PayOS.

**Tech Stack:** TypeScript full-stack — Next.js, Expo, NestJS, PostgreSQL/Prisma, Firebase Auth, Gemini, PayOS, Turborepo

---

## Must-Haves

**Goal:** Người dùng có thể quản lý tài chính cá nhân trên mobile và web, có AI coaching, premium qua PayOS, admin quản trị hệ thống.

### Observable Truths

1. Người dùng mở web thấy landing page dạng hành trình scroll ngang mượt, CTA rõ ràng.
2. Admin đăng nhập qua cổng riêng và quản lý users/transactions/subscriptions trong dashboard.
3. Người dùng mobile đăng nhập bằng Google hoặc số điện thoại OTP.
4. Người dùng tạo/sửa/xóa ví, giao dịch, mục tiêu tiết kiệm trên mobile.
5. AI coach phản hồi dựa trên dữ liệu chi tiêu cá nhân, có giải thích dễ hiểu.
6. Người dùng nâng cấp premium qua PayOS thành công; trạng thái premium đồng bộ về app.
7. Web và Mobile đều có bản deploy chạy ổn định.

### Required Artifacts

| Artifact                  | Provides                                               | Path                          |
| ------------------------- | ------------------------------------------------------ | ----------------------------- |
| Product architecture spec | Kiến trúc hệ thống + boundary services                 | `docs/srs/architecture-v1.md` |
| Master SRS v2             | Yêu cầu nghiệp vụ chuẩn hóa                            | `docs/srs/fingenie-srs-v2.md` |
| Web app (Landing + Admin) | UI/UX web + admin operations                           | `apps/web/**`                 |
| Mobile app (Expo)         | Ứng dụng người dùng cuối                               | `apps/mobile/**`              |
| Backend API               | Business logic, auth verification, payment webhook     | `apps/api/**`                 |
| DB schema + migrations    | Dữ liệu users/wallets/transactions/goals/subscriptions | `infra/db/**`                 |
| CI/CD docs + scripts      | Quy trình deploy Web/Mobile                            | `docs/deploy/**`              |

### Key Links

| From               | To                  | Via                              | Risk                            |
| ------------------ | ------------------- | -------------------------------- | ------------------------------- |
| Mobile Auth        | Auth Provider       | Google/Phone OTP flow            | OTP fail/rate-limit             |
| Admin Login        | Backend RBAC        | JWT claims + role check          | privilege escalation            |
| PayOS checkout     | Payment webhook     | server callback verify signature | sai trạng thái premium          |
| AI Coach           | User finance data   | retrieval + prompt template      | hallucination / advice mismatch |
| Landing animations | Browser performance | scroll engine + GPU effects      | giật lag thiết bị yếu           |

---

## Technology Decisions

| Layer         | Technology                       | Lý do chọn                                             |
| ------------- | -------------------------------- | ------------------------------------------------------ |
| Monorepo      | Turborepo + pnpm                 | Code sharing, unified build pipeline                   |
| Web           | Next.js 15 + Tailwind            | SSR/SSG tốt, SEO landing page, React ecosystem         |
| Web Animation | Framer Motion + GSAP             | Horizontal scroll storytelling, GPU-optimized          |
| Mobile        | Expo (React Native, Expo Router) | Cross-platform iOS/Android, OTA updates, EAS Build     |
| API           | NestJS (TypeScript)              | Type-safe, modular, dễ scale, OpenAPI tích hợp sẵn     |
| DB            | PostgreSQL + Prisma              | Relational + type-safe ORM, migration tracking         |
| Cache/Queue   | Redis + BullMQ                   | Alerts async, payment retry jobs, rate limiting        |
| Auth          | Firebase Auth                    | Google Sign-In + Phone OTP out-of-box, token verify    |
| AI            | Gemini API                       | SRS requirement, multimodal, cost hợp lý               |
| Payment       | PayOS                            | Thị trường Việt Nam, link-based, webhook               |
| Observability | OpenTelemetry + Prometheus + Grafana | Standardized metrics, dashboards, alerting         |
| Deploy Web    | Vercel                           | Next.js native, edge CDN, preview URLs                 |
| Deploy API    | Railway/Fly.io                   | Docker-friendly, auto-scaling, managed DB options      |
| Deploy Mobile | EAS Build + stores               | Managed Expo builds, OTA updates                       |

> **Assumption:** Ưu tiên tốc độ ra mắt và DX tốt hơn việc giữ Java Spring Boot từ SRS MVP cũ. Stack TypeScript full-stack giảm context switching, tái sử dụng types qua monorepo.

---

## Task Dependency Graph

```
Task P1 (Architecture doc): needs nothing, creates docs/srs/architecture-v1.md
Task P2 (SRS v2):           needs nothing, creates docs/srs/fingenie-srs-v2.md
Task A1 (Monorepo setup):   needs P1, creates repo scaffold
Task A2 (DB schema):        needs P1+P2, creates Prisma schema + migrations
Task A3 (Auth skeleton):    needs A1, creates auth flows
Task B1 (Finance core API): needs A2+A3, creates wallet/transaction/report APIs
Task B2 (Smart Planner):    needs A2+A3, creates saving plan + safe money logic
Task B3 (AI Coach):         needs B1, creates AI chat + explainability layer
Task B4 (PayOS premium):    needs A3+B1, creates payment + webhook + entitlement
Task C1 (Mobile app):       needs B1+B2+B3+B4, creates Expo UI full flows
Task C2 (Landing page):     needs A1, creates Next.js horizontal adventure UI
Task C3 (Admin dashboard):  needs B1+B4, creates admin ops UI
Task D1 (Deploy + CI/CD):   needs C1+C2+C3, creates production deployment
```

**Wave execution:**
- Wave 1: P1, P2 (parallel — foundation docs)
- Wave 2: A1, A2, A3 (parallel after Wave 1)
- Wave 3: B1, B2, B3, B4 (parallel after Wave 2 — core build)
- Wave 4: C1, C2, C3 (parallel after Wave 3 — UI + experience)
- Wave 5: D1 (after Wave 4 — production deploy)

---

## Phase 1: Foundation & Architecture

### Task P1: Product Architecture Document

**Files:**
- Create: `docs/srs/architecture-v1.md`

**Deliverables:**
- System context diagram (text-based C4)
- Component boundary diagram (API, Web, Mobile, AI, Payment, Auth)
- ERD (core entities)
- Key sequence diagrams: Auth, Payment, AI Coach
- Infrastructure topology (Vercel + Railway + Firebase)

**Acceptance:** Architecture doc reviewed + approved, no ambiguous service boundaries.

---

### Task A1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/api/` (NestJS skeleton)
- Create: `apps/web/` (Next.js skeleton)
- Create: `apps/mobile/` (Expo skeleton)
- Create: `packages/shared-types/` (shared TypeScript types)
- Create: `packages/ui/` (shared UI primitives)

**Steps:**

1. Init pnpm workspace với turbo
2. Tạo NestJS app tại `apps/api`
3. Tạo Next.js app tại `apps/web`
4. Tạo Expo app tại `apps/mobile`
5. Cấu hình shared-types package
6. Verify: `pnpm build` thành công từ root

**Acceptance:** `pnpm build --filter=*` passes tất cả apps.

---

### Task A2: Database Schema & Migrations

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/`
- Create: `infra/db/seed.ts`

**Core entities:**
```prisma
User, UserProfile, AdminRole
Wallet, Transaction, Category
SavingPlan, SafeMoneyConfig, AlertEvent
AIChatSession, AIMessage
Subscription, PaymentOrder, PaymentWebhookEvent
```

**Steps:**

1. Define Prisma schema với tất cả entities
2. Run `prisma migrate dev --name init`
3. Tạo seed data cho dev
4. Verify: `prisma db push` + `prisma generate` sạch

**Acceptance:** Migration chạy thành công, không có unresolved relations.

---

### Task A3: Authentication Skeleton

**Files:**
- Create: `apps/api/src/auth/` (NestJS auth module)
- Create: `apps/mobile/src/auth/` (mobile auth hooks)
- Create: `packages/shared-types/src/auth.ts`

**Steps:**

1. Cấu hình Firebase Admin SDK trong NestJS
2. Tạo `POST /auth/verify` nhận Firebase ID token, trả JWT nội bộ
3. Implement `POST /auth/refresh` và `POST /auth/logout`
4. Guard: `@UseGuards(AuthGuard)` bảo vệ private routes
5. RBAC: `@Roles('admin')` guard cho admin endpoints
6. Mobile: expo-auth-session + Firebase Google Sign-In
7. Mobile: Firebase Phone OTP flow
8. Verify: E2E test Google login + Phone OTP login

**Acceptance:** Token verify thành công, RBAC block unauthorized access đúng.

---

## Phase 2: Core Build

### Task B1: Finance Core API

**Files:**
- Create: `apps/api/src/wallet/`
- Create: `apps/api/src/transaction/`
- Create: `apps/api/src/report/`

**Endpoints:**
```
POST   /wallets                    Create wallet
GET    /wallets                    List user wallets
PUT    /wallets/:id                Update wallet
DELETE /wallets/:id                Delete wallet

POST   /transactions               Add transaction
GET    /transactions               List with filters
PUT    /transactions/:id           Update
DELETE /transactions/:id           Delete

GET    /reports/summary            Daily/weekly/monthly totals
GET    /reports/by-category        Category breakdown
GET    /reports/trend              Time-series data
```

**Acceptance:** CRUD operations pass, reports aggregate correctly, auth guard enforced.

---

### Task B2: Smart Saving Planner API

**Files:**
- Create: `apps/api/src/saving-planner/`

**Logic:**
- `income - fixed_costs - variable_costs = disposable`
- `disposable * saving_pct = monthly_saving`
- `(disposable - monthly_saving) / days_in_month = daily_budget`
- Safe Money Basic: `daily_budget * 3` (3-day buffer)
- Safe Money Advanced: dynamic threshold based on spending velocity

**Acceptance:** Test cases TC-3.8-01 → TC-3.8-05 từ SRS gốc pass.

---

### Task B3: AI Coach Module

**Files:**
- Create: `apps/api/src/ai-coach/`

**Features:**
- Chat endpoint với context injection từ user transactions
- Explanation layer: mọi response phải có `reasoning` field
- Rate limiting theo free/premium tier
- Safety disclaimer tự động đính kèm
- Prompt templates chuẩn hóa

**Acceptance:** AI response có reasoning, rate limit hoạt động, disclaimer present.

---

### Task B4: PayOS Premium & Billing

**Files:**
- Create: `apps/api/src/billing/`

**Flow:**
1. `POST /billing/create-payment` → tạo PayOS payment link
2. `POST /billing/webhook` → nhận PayOS callback (verify signature)
3. Idempotency: check `PaymentOrder.payosOrderId` trước khi process
4. On success: update `Subscription.status = active`, set `expiresAt`
5. Mobile deep-link: `fingenie://billing/success?orderId=xxx`

**Acceptance:** Sandbox payment success cập nhật entitlement, duplicate webhook ignored.

---

## Phase 3: Experience, Hardening, Deployment

### Task C1: Mobile App (Expo)

**Files:**
- Build: `apps/mobile/src/`

**Screens:**
- Onboarding + Auth (Google/OTP)
- Dashboard (balance overview, recent transactions, pet)
- Wallet management
- Transaction add/edit
- Reports (charts)
- Smart Saving Planner
- AI Coach chat
- Premium upgrade (PayOS deep-link)
- Profile settings

**Design system:** NativeWind + custom component library, modern card-based UI, smooth transitions.

**Acceptance:** All Gate A + B flows completable, UI passes design review.

---

### Task C2: Landing Page (Next.js)

**Files:**
- Build: `apps/web/src/app/page.tsx` (landing)
- Build: `apps/web/src/components/landing/`

**Sections (horizontal scroll adventure):**
1. Hero — "Meet FinGenie" với particle/kính effect
2. Problem — gương vỡ → tài chính hỗn độn
3. Solution — FinGenie features reveal animation
4. AI Coach demo — interactive mockup
5. Gamification — Pet character animation
6. Premium/Pricing — glass card tiers
7. CTA — App store links + waitlist

**Technical:**
- GSAP horizontal scroll (pin + scrub)
- Framer Motion per-element entrance
- Glassmorphism design tokens
- Admin login button: góc phải, rõ ràng nhưng subtle
- Adaptive: reduced-motion media query fallback
- Lighthouse perf score ≥ 85

**Acceptance:** Smooth scroll on Chrome/Safari, Lighthouse ≥ 85, admin login visible.

---

### Task C3: Admin Dashboard

**Files:**
- Build: `apps/web/src/app/admin/`

**Pages:**
- `/admin/login` — riêng, không link từ user flow
- `/admin/users` — list, search, lock/unlock
- `/admin/transactions` — audit log overview
- `/admin/subscriptions` — premium status management
- `/admin/monitoring` — embed Grafana panels / key metrics

**Acceptance:** RBAC enforced, admin operations logged, session timeout active.

---

### Task D1: Production Deployment

**Files:**
- Create: `docs/deploy/web-deploy.md`
- Create: `docs/deploy/api-deploy.md`
- Create: `docs/deploy/mobile-release.md`
- Create: `.github/workflows/`

**Checklist:**
- Vercel: web deploy + env vars + domain
- Railway/Fly.io: API deploy + Postgres + Redis managed
- EAS Build: mobile internal → beta → production build
- Prometheus/Grafana: metrics collection active
- Backup: daily Postgres snapshot configured
- Alerts: webhook fail, auth error rate, high latency

**Acceptance:** All Gate C criteria pass (production URLs live, monitoring active).

---

## Release Gates

### Gate A – Core User Flow
- [ ] Login Google/Phone OTP thành công
- [ ] Tạo ví + giao dịch + báo cáo cơ bản
- [ ] Tạo saving plan + cảnh báo ngưỡng an toàn

### Gate B – Premium & AI
- [ ] Chat AI có giải thích và disclaimer
- [ ] Thanh toán PayOS thành công và cập nhật premium
- [ ] Rate limiting AI theo tier

### Gate C – Admin & Deployment
- [ ] Admin dashboard: user management, subscription ops
- [ ] Web production URL live
- [ ] Mobile build installable (beta)
- [ ] Monitoring dashboards + alerts active
- [ ] Backup policy verified

---

## Risks & Mitigations

| Risk                          | Mitigation                                              |
| ----------------------------- | ------------------------------------------------------- |
| OTP delivery fail             | Retry policy, fallback UX, rate limit handling          |
| Payment webhook inconsistency | Idempotency keys, signature verify, audit log           |
| AI advice trust               | Disclaimer + explainability + safety guardrails         |
| Landing animation lag         | Adaptive effects, reduced-motion mode, Lighthouse CI    |
| Scope creep                   | Vertical slices, release gates, scope freeze per phase  |
| Auth token compromise         | Short-lived JWT, refresh rotation, logout invalidation  |
