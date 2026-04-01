# Plan: FinGenie Web + Mobile Delivery

> **For Claude:** REQUIRED SUB-SKILL: Use skill({ name: "executing-plans" }) to implement this plan task-by-task.

**Goal:** Xây dựng và triển khai FinGenie production-ready trên cả Web (Landing + Admin) và Mobile (Expo), có AI coaching, auth Google/Phone OTP, và thanh toán PayOS.

**Architecture:** Monorepo (Turborepo + pnpm), Next.js cho Web/Admin, Expo cho Mobile, NestJS API backend. Auth qua Firebase (Google + Phone OTP), payment qua PayOS, AI qua Gemini API.

**Tech Stack:** Next.js 15, Expo (React Native), NestJS, PostgreSQL + Prisma, Firebase Auth, Gemini API, PayOS, Prometheus + Grafana, Vercel (web), EAS Build (mobile)

---

## Must-Haves

**Goal:** Deploy production-ready FinGenie trên cả Web và Mobile, user có thể đăng nhập, quản lý tài chính, nhận tư vấn AI, và nâng cấp premium qua PayOS.

### Observable Truths

1. Người dùng mở web thấy landing page dạng hành trình scroll ngang mượt, kính/modern/motion cao cấp, CTA rõ ràng.
2. Admin đăng nhập được từ web và quản lý users/transactions/subscriptions trong dashboard.
3. Người dùng mobile đăng nhập được bằng Google hoặc số điện thoại OTP.
4. Người dùng tạo/sửa/xóa ví, giao dịch, mục tiêu tiết kiệm trên mobile.
5. AI coach phản hồi dựa trên dữ liệu chi tiêu cá nhân, có giải thích dễ hiểu.
6. Người dùng nâng cấp premium qua PayOS thành công; trạng thái premium đồng bộ về app.
7. Web và Mobile đều có bản deploy chạy ổn định.

### Required Artifacts

| Artifact                  | Provides                                               | Path                         |
| ------------------------- | ------------------------------------------------------ | ---------------------------- |
| Master SRS v2             | Yêu cầu nghiệp vụ chuẩn hóa                           | `docs/srs/fingenie-srs-v2.md` |
| Architecture diagram      | Kiến trúc hệ thống + boundary services                 | `docs/srs/architecture-v1.md` |
| Web app (Landing + Admin) | UI/UX web + admin operations                           | `apps/web/**`                 |
| Mobile app (Expo)         | Ứng dụng người dùng cuối                               | `apps/mobile/**`              |
| Backend API               | Business logic, auth verification, payment webhook     | `apps/api/**`                 |
| DB schema + migrations    | Dữ liệu users/wallets/transactions/goals/subscriptions | `infra/db/**`                 |
| CI/CD docs                | Quy trình deploy Web/Mobile                            | `docs/deploy/**`              |

### Key Links

| From               | To                | Via                              | Risk                            |
| ------------------ | ----------------- | -------------------------------- | ------------------------------- |
| Mobile Auth        | Firebase Auth     | Google/Phone OTP flow            | OTP fail/rate-limit             |
| Admin Login        | Backend RBAC      | JWT claims + role check          | privilege escalation            |
| PayOS checkout     | Payment webhook   | server callback verify signature | sai trạng thái premium          |
| AI Coach           | User finance data | retrieval + prompt template      | hallucination / advice mismatch |
| Landing animations | Browser GPU       | scroll engine + GPU effects      | giật lag thiết bị yếu           |

---

## Technology Decisions

| Concern        | Choice                      | Reason                                                |
| -------------- | --------------------------- | ----------------------------------------------------- |
| Monorepo       | Turborepo + pnpm            | Chia sẻ types, scripts, fast DX                       |
| Web            | Next.js 15 (App Router)     | SSR + RSC, Vercel deploy native                       |
| Animation      | Framer Motion + GSAP        | Horizontal storytelling, glass effects                |
| Mobile         | Expo SDK (React Native)     | Cross-platform, EAS Build/Submit, TypeScript          |
| API            | NestJS (TypeScript)         | Decorator-based, OpenAPI gen, test-friendly           |
| DB             | PostgreSQL + Prisma         | Relational, type-safe ORM, migration built-in         |
| Cache/Queue    | Redis + BullMQ              | Alerts async jobs, session, rate limit                |
| Auth           | Firebase Auth               | Google + Phone OTP out-of-box, backend token verify   |
| AI             | Gemini API                  | SRS requirement, multimodal ready                     |
| Payment        | PayOS                       | VN market, webhook + deep-link support                |
| Observability  | OpenTelemetry + Prometheus + Grafana | Standard metrics pipeline                  |
| Deploy Web     | Vercel                      | Next.js native, edge CDN, preview URLs                |
| Deploy API     | Railway / Fly.io            | Container-based, simple scale                         |
| Deploy Mobile  | EAS Build + EAS Submit      | Expo-native CI/CD to stores                           |
| DB Hosting     | Supabase (PostgreSQL)       | Managed, built-in backups, branching                  |

---

## Task Dependency Graph

```
Task A (Monorepo + Infra setup):        needs nothing          → creates repo scaffold
Task B (DB Schema + Prisma):            needs A                → creates schema + migrations
Task C (Auth - Firebase + API):         needs A, B             → creates auth flow
Task D (Wallet/Transactions API):       needs B, C             → creates finance CRUD
Task E (Smart Saving Planner API):      needs B, C             → creates saving logic
Task F (AI Coach - Gemini):             needs D, E             → creates AI integration
Task G (Premium + PayOS):               needs C, D             → creates payment flow
Task H (Mobile app - Expo):             needs C, D, E, F, G    → creates mobile UX
Task I (Landing Page - Next.js):        needs A                → creates web experience
Task J (Admin Dashboard - Next.js):     needs C, D, G          → creates admin ops
Task K (Observability + CI/CD):         needs all              → creates deploy pipeline
```

### Execution Waves

```
Wave 1: Task A (Monorepo setup)
Wave 2: Task B (DB), Task I (Landing — frontend only, no API dep)
Wave 3: Task C (Auth)
Wave 4: Task D (Finance API), Task E (Saving Planner)
Wave 5: Task F (AI), Task G (PayOS)
Wave 6: Task H (Mobile), Task J (Admin Dashboard)
Wave 7: Task K (Observability + CI/CD + Deploy)
```

---

## Phases

### Phase 1: Foundation (Wave 1–3)
- [ ] Task A: Monorepo setup (Turborepo + pnpm, apps/web, apps/mobile, apps/api, packages/shared-types)
- [ ] Task B: DB schema + Prisma setup (entities: User, Wallet, Transaction, Category, SavingPlan, Subscription, PaymentOrder, AIChatSession)
- [ ] Task I: Landing page skeleton (horizontal scroll, glass morphism, Framer Motion/GSAP)
- [ ] Task C: Auth (Firebase Auth → API middleware, Google + Phone OTP, admin role seeding)

**Gate:** Login mobile/web thành công; DB migrate clean; Landing page có thể mở trên browser.

### Phase 2: Core Business (Wave 4–5)
- [ ] Task D: Wallet & Transaction CRUD + Reporting API
- [ ] Task E: Smart Saving Planner (income/expenses input, safe money threshold, daily budget calc)
- [ ] Task F: AI Coach (Gemini integration, chat API, explainability, usage limits by tier)
- [ ] Task G: Premium + PayOS (create payment link, webhook verify, entitlement sync, mobile deep-link)

**Gate:** E2E: create wallet → add transaction → get saving plan → chat AI → upgrade premium.

### Phase 3: Experience & Deployment (Wave 6–7)
- [ ] Task H: Mobile app polish (Expo Router, auth screens, dashboard, transactions, AI chat, premium)
- [ ] Task J: Admin dashboard (user management, transaction overview, subscriptions, alerts)
- [ ] Task K: CI/CD + Observability + Production deploy (web → Vercel, API → Railway/Fly.io, Mobile → EAS)

**Gate:** Production URL live; Mobile build installable; Monitoring dashboards active.

---

## System-level Acceptance Criteria

### E2E Smoke Test
1. User signup/login (Google + Phone OTP) ✓
2. Create wallet + add expense + view report ✓
3. Create saving plan → get daily budget + safe money threshold ✓
4. Ask AI for advice → receive explanation with disclaimer ✓
5. Upgrade premium via PayOS → entitlement updated ✓

### Admin Test
1. Admin login via separate URL ✓
2. View/block user, audit payment history ✓
3. Monitor usage metrics on Grafana dashboard ✓

### Deploy Test
1. Web production URL reachable with HTTPS ✓
2. Mobile build installable (internal/TestFlight/Play Internal) ✓
3. Monitoring dashboards active, alert rules enabled ✓

---

## Risks & Mitigations

| Risk                         | Impact | Mitigation                                                  |
| ---------------------------- | ------ | ----------------------------------------------------------- |
| Auth OTP delivery fail       | High   | Retry policy + fallback UX + rate limiting                  |
| Payment webhook race/dup     | High   | Idempotency keys + signed webhook verify                    |
| AI advice trust issue        | Medium | Disclaimer + explainability + prompt safety guardrails      |
| Landing page lag             | Medium | Adaptive effects + reduced-motion mode + Lighthouse budget  |
| Scope creep                  | High   | Vertical slices + release gate blocking                     |

---

## Next Command
`/start Phase 1 – Task A: Monorepo Setup`
