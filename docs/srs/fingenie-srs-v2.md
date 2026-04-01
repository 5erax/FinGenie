# SOFTWARE REQUIREMENTS SPECIFICATION (SRS) – FinGenie v2

## 1. Introduction

### 1.1 Purpose
Tài liệu này xác định đầy đủ yêu cầu chức năng và phi chức năng cho FinGenie v2, phục vụ triển khai production trên:
- **Web:** Landing Page (horizontal scroll adventure) + Admin Dashboard
- **Mobile:** Expo app cho người dùng cuối

### 1.2 Product Scope
FinGenie là nền tảng quản lý tài chính cá nhân tích hợp AI, giúp người dùng:
- Ghi nhận và phân tích chi tiêu
- Lập kế hoạch tiết kiệm thông minh
- Nhận tư vấn tài chính có giải thích từ AI Coach
- Nâng cấp premium qua PayOS
- Trải nghiệm gamification (pet) để duy trì thói quen tài chính tốt

### 1.3 Stakeholders
| Stakeholder | Vai trò |
|---|---|
| End users (Gen Z, young professionals 18-30) | Sử dụng app mobile |
| Admin vận hành | Quản lý hệ thống qua web dashboard |
| Product/Business owner | Ra quyết định sản phẩm |
| Engineering team | Phát triển và vận hành |

### 1.4 Definitions
| Thuật ngữ | Mô tả |
|---|---|
| AI Coach | Trợ lý tài chính dựa trên Gemini |
| Premium Entitlement | Trạng thái quyền truy cập tính năng trả phí |
| OTP | One-Time Password |
| RBAC | Role-Based Access Control |
| Safe Money Threshold | Ngưỡng tiền an toàn theo hành vi chi tiêu |

### 1.5 References
- SRS MVP gốc (v1)
- Pitch deck FinGenie
- Khảo sát người dùng (192 phản hồi, 92% đánh giá dễ dùng & hữu ích)

---

## 2. Overall Description

### 2.1 Product Perspective
Hệ thống gồm 3 thành phần chính:
1. **Web Landing** – marketing experience, horizontal scroll adventure, glass morphism
2. **Admin Dashboard** – quản trị hệ thống (cùng Next.js app)
3. **Mobile App** – user operations chính (Expo React Native)

### 2.2 User Classes
| User Class | Mô tả | Nền tảng |
|---|---|---|
| User Free | Tính năng cơ bản, giới hạn AI | Mobile |
| User Premium | Full tính năng, AI không giới hạn | Mobile |
| Admin | Quản trị users, payments, monitoring | Web |

### 2.3 Operating Environment
- Mobile: iOS/Android (Expo build)
- Web/Admin: Modern browsers (Chrome, Safari, Edge)
- Backend: Cloud deployment (Railway/Fly.io)
- Database: PostgreSQL (Supabase managed)
- AI: Gemini API
- Payment: PayOS

### 2.4 Assumptions and Constraints
| Loại | Nội dung |
|---|---|
| Assumption | Không kết nối ngân hàng trực tiếp giai đoạn đầu |
| Assumption | Người dùng nhập dữ liệu chi tiêu trung thực |
| Assumption | AI chỉ hỗ trợ, không thay thế tư vấn tài chính chuyên nghiệp |
| Constraint | Auth bắt buộc: Google + Phone OTP |
| Constraint | Thanh toán premium qua PayOS |
| Constraint | Deploy cả Web và Mobile |
| Constraint | Tuân thủ bảo mật dữ liệu cá nhân |

---

## 3. System Architecture

### 3.1 Architecture Style
Modular Monolith + BFF API (TypeScript-first Monorepo).

### 3.2 Technology Stack
| Layer | Technology | Reason |
|---|---|---|
| Monorepo | Turborepo + pnpm | Shared types, fast DX |
| Web | Next.js 15 (App Router) | SSR + RSC, Vercel deploy |
| Animation | Framer Motion + GSAP | Horizontal scroll, glass effects |
| Mobile | Expo SDK (React Native) | Cross-platform, EAS Build |
| API | NestJS (TypeScript) | OpenAPI gen, test-friendly |
| DB | PostgreSQL + Prisma | Type-safe ORM, migrations |
| Cache/Queue | Redis + BullMQ | Async jobs, rate limit |
| Auth | Firebase Auth | Google + Phone OTP native |
| AI | Gemini API | Financial advisor + explainability |
| Payment | PayOS | VN market, webhook + deep-link |
| Observability | OpenTelemetry + Prometheus + Grafana | Metrics pipeline |
| Deploy Web | Vercel | Next.js native, edge CDN |
| Deploy API | Railway / Fly.io | Container-based |
| Deploy Mobile | EAS Build + Submit | Expo CI/CD to stores |
| DB Hosting | Supabase | Managed PostgreSQL + backups |

### 3.3 Monorepo Structure
```
fingenie/
├── apps/
│   ├── web/           # Next.js 15 (Landing + Admin Dashboard)
│   ├── mobile/        # Expo React Native app
│   └── api/           # NestJS backend
├── packages/
│   ├── shared-types/  # TypeScript types shared across apps
│   ├── ui/            # Shared UI components (optional)
│   └── config/        # Shared configs (ESLint, TS, Tailwind)
├── infra/
│   └── db/            # Prisma schema + migrations
├── docs/
│   ├── srs/           # This document
│   └── deploy/        # Deployment runbooks
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Functional Requirements

### 4.1 Authentication & Account (FR-4.1)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.1.1 | User đăng nhập bằng Google | Must |
| FR-4.1.2 | User đăng nhập bằng số điện thoại OTP | Must |
| FR-4.1.3 | User cập nhật hồ sơ cá nhân (tên, avatar) | Should |
| FR-4.1.4 | Admin đăng nhập qua cổng riêng trên web, chỉ role admin truy cập dashboard | Must |
| FR-4.1.5 | Token refresh tự động, logout an toàn | Must |

### 4.2 Wallet & Transactions (FR-4.2)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.2.1 | User tạo/sửa/xóa ví | Must |
| FR-4.2.2 | User xem số dư từng ví | Must |
| FR-4.2.3 | User thêm/sửa/xóa giao dịch thu/chi | Must |
| FR-4.2.4 | Giao dịch phân loại theo category, thời gian, ví | Must |
| FR-4.2.5 | Hỗ trợ categories mặc định + custom | Should |

### 4.3 Analytics & Reporting (FR-4.3)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.3.1 | Tổng hợp chi tiêu theo ngày/tuần/tháng | Must |
| FR-4.3.2 | Trực quan hóa bằng biểu đồ (pie, bar, line) | Must |
| FR-4.3.3 | Premium mở khóa báo cáo nâng cao (trend, comparison) | Should |

### 4.4 Smart Saving Planner (FR-4.4)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.4.1 | User nhập thu nhập hàng tháng | Must |
| FR-4.4.2 | User nhập chi phí cố định và chi phí dự kiến phát sinh | Must |
| FR-4.4.3 | User chỉnh % tiết kiệm mong muốn | Must |
| FR-4.4.4 | Hệ thống tính ngân sách chi tiêu/ngày | Must |
| FR-4.4.5 | Hệ thống đề xuất kế hoạch tiết kiệm tối ưu | Must |
| FR-4.4.6 | Hệ thống tính Safe Money Threshold | Must |
| FR-4.4.7 | Hỗ trợ Safe Money Basic / Advanced mode | Should |
| FR-4.4.8 | Cảnh báo khi chi tiêu tiệm cận/vượt ngưỡng an toàn | Must |
| FR-4.4.9 | AI giải thích logic đề xuất bằng ngôn ngữ tự nhiên | Must |

### 4.5 AI Coach (FR-4.5)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.5.1 | User chat với AI về tình trạng tài chính cá nhân | Must |
| FR-4.5.2 | AI phản hồi dựa trên dữ liệu giao dịch thực tế | Must |
| FR-4.5.3 | Hạn mức sử dụng AI: Free = 5 msg/ngày, Premium = unlimited | Must |
| FR-4.5.4 | AI kèm disclaimer "tư vấn tham khảo, không thay thế chuyên gia" | Must |
| FR-4.5.5 | Lưu lịch sử chat theo session | Should |

### 4.6 Gamification – Pet (FR-4.6)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.6.1 | User có pet đại diện sức khỏe tài chính | Should |
| FR-4.6.2 | Trạng thái pet thay đổi theo hành vi chi tiêu/tiết kiệm | Should |
| FR-4.6.3 | Phản hồi trực quan (animation, mood) để tăng động lực | Could |

### 4.7 Premium & Billing – PayOS (FR-4.7)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.7.1 | User tạo yêu cầu nâng cấp premium | Must |
| FR-4.7.2 | Hệ thống tạo payment link PayOS | Must |
| FR-4.7.3 | Sau thanh toán thành công, entitlement premium được cập nhật | Must |
| FR-4.7.4 | Mobile hỗ trợ deep-link quay lại app sau thanh toán | Must |
| FR-4.7.5 | Webhook có xác thực chữ ký, xử lý idempotent | Must |
| FR-4.7.6 | Hỗ trợ subscription monthly/yearly | Should |

### 4.8 Landing Page – Web (FR-4.8)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.8.1 | Landing page dạng horizontal scroll storytelling | Must |
| FR-4.8.2 | Hiệu ứng glass morphism / modern / motion mượt mỗi section | Must |
| FR-4.8.3 | CTA rõ ràng: download app, trải nghiệm demo, premium | Must |
| FR-4.8.4 | Nút admin login riêng (không lộ cho user thường) | Must |
| FR-4.8.5 | Responsive trên mobile browser | Should |
| FR-4.8.6 | Reduced-motion mode cho accessibility | Should |

### 4.9 Admin Dashboard (FR-4.9)
| ID | Requirement | Priority |
|---|---|---|
| FR-4.9.1 | Quản lý người dùng: xem, tìm kiếm, khóa/mở khóa | Must |
| FR-4.9.2 | Theo dõi tổng quan giao dịch và hành vi sử dụng | Must |
| FR-4.9.3 | Quản lý subscriptions/premium status | Must |
| FR-4.9.4 | Theo dõi logs lỗi, metrics cơ bản | Should |
| FR-4.9.5 | Export dữ liệu báo cáo (CSV) | Could |

---

## 5. Non-Functional Requirements

### 5.1 Performance
| ID | Requirement | Target |
|---|---|---|
| NFR-5.1.1 | P95 API response cho thao tác chính | ≤ 1.5s |
| NFR-5.1.2 | Landing page UX mượt | 60fps target trên thiết bị phổ biến |
| NFR-5.1.3 | Concurrent active users (MVP+) | ≥ 1,000 |
| NFR-5.1.4 | Mobile app cold start | ≤ 3s |

### 5.2 Availability & Reliability
| ID | Requirement | Target |
|---|---|---|
| NFR-5.2.1 | Backend uptime | ≥ 99.5% |
| NFR-5.2.2 | Database backup | Daily automated, restore tested monthly |
| NFR-5.2.3 | Graceful degradation khi AI service down | Hiển thị thông báo, không crash |

### 5.3 Security & Privacy
| ID | Requirement |
|---|---|
| NFR-5.3.1 | TLS cho mọi dữ liệu truyền tải |
| NFR-5.3.2 | Mã hóa dữ liệu nhạy cảm khi lưu trữ |
| NFR-5.3.3 | RBAC bắt buộc cho admin endpoints |
| NFR-5.3.4 | Người dùng có quyền yêu cầu xóa dữ liệu cá nhân |
| NFR-5.3.5 | Rate limiting cho auth + AI endpoints |
| NFR-5.3.6 | CORS configuration chặt chẽ |

### 5.4 Usability
| ID | Requirement | Target |
|---|---|---|
| NFR-5.4.1 | Người dùng mới hoàn thành giao dịch đầu tiên | ≤ 3 phút |
| NFR-5.4.2 | Mobile UI thao tác một tay | Comfortable thumb zone |

### 5.5 AI Explainability & Safety
| ID | Requirement |
|---|---|
| NFR-5.5.1 | Mọi khuyến nghị AI kèm "Lý do đề xuất" |
| NFR-5.5.2 | Không đưa mệnh lệnh tài chính bắt buộc |
| NFR-5.5.3 | Prompt safety guardrails ngăn injection |

### 5.6 Observability
| ID | Requirement |
|---|---|
| NFR-5.6.1 | Export metrics cho Prometheus |
| NFR-5.6.2 | Grafana dashboard: latency, errors, payment success rate |
| NFR-5.6.3 | Alert real-time cho webhook/auth thất bại cao |

### 5.7 Deployability
| ID | Requirement |
|---|---|
| NFR-5.7.1 | CI/CD cho web + backend (auto deploy on merge) |
| NFR-5.7.2 | EAS Build/Release pipeline cho mobile |
| NFR-5.7.3 | Rollback runbook khi deploy lỗi |

---

## 6. Data Requirements

### 6.1 Core Entities
```
User { id, email, phone, displayName, avatarUrl, role, premiumUntil, createdAt }
Wallet { id, userId, name, type, balance, currency, createdAt }
Transaction { id, walletId, userId, amount, type(income/expense), categoryId, note, date }
Category { id, name, icon, color, isDefault, userId? }
SavingPlan { id, userId, monthlyIncome, fixedExpenses, variableExpenses, savingPercent, dailyBudget, safeMoney }
SafeMoneyConfig { id, savingPlanId, mode(basic/advanced), sensitivity, threshold }
AlertEvent { id, userId, type, message, isRead, createdAt }
AIChatSession { id, userId, title, createdAt }
AIMessage { id, sessionId, role(user/assistant), content, createdAt }
Subscription { id, userId, plan(free/monthly/yearly), status, startDate, endDate }
PaymentOrder { id, userId, subscriptionId, payosOrderId, amount, status, createdAt }
PaymentWebhookEvent { id, payosOrderId, payload, signature, processedAt }
```

### 6.2 Data Rules
- Password không lưu plaintext (Firebase Auth handles)
- Payment events lưu immutable audit log
- Soft-delete cho dữ liệu quan trọng (User, Transaction)
- Timezone: UTC storage, client-side conversion

---

## 7. External Integrations

### 7.1 Firebase Auth
- Google Sign-In (mobile + web admin)
- Phone OTP (mobile)
- Backend verify ID token → extract uid, role claims

### 7.2 Gemini API
- Chat completions cho financial advice
- Prompt templates + safety guardrails
- Context injection: user transaction summary

### 7.3 PayOS
- Server-side: POST /v2/payment-requests → tạo payment link
- Webhook: POST /api/payment/webhook → verify signature → update subscription
- Mobile: deep-link return `fingenie://payment/success`

---

## 8. Acceptance Criteria (Release Gates)

### Gate A – Core User Flow
- [ ] Login Google/Phone OTP thành công trên mobile
- [ ] Tạo ví + giao dịch + xem báo cáo cơ bản
- [ ] Tạo saving plan + nhận cảnh báo ngưỡng an toàn

### Gate B – Premium & AI
- [ ] Chat AI có giải thích, kèm disclaimer
- [ ] Thanh toán PayOS thành công → premium entitlement cập nhật
- [ ] Deep-link mobile quay về app sau thanh toán

### Gate C – Admin & Deployment
- [ ] Admin dashboard: CRUD users, view payments, subscriptions
- [ ] Web production live trên Vercel (HTTPS)
- [ ] Mobile build phát hành qua EAS
- [ ] Monitoring Grafana + alert rules hoạt động

---

## 9. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| OTP delivery fail | High | Medium | Retry policy + fallback UX + rate limiting |
| Payment webhook inconsistency | High | Medium | Idempotency keys + signature verify |
| AI hallucination | Medium | Medium | Explainability + disclaimer + safety filters |
| Landing animation lag | Medium | Low | Adaptive effects + reduced-motion + Lighthouse budget |
| Scope creep | High | High | Vertical slices + release gates + phase blocking |
| Data breach | Critical | Low | TLS + encryption at rest + RBAC + audit log |

---

## 10. Roadmap

| Phase | Deliverables | Gate |
|---|---|---|
| Phase 1: Foundation | Monorepo + DB + Auth + Landing skeleton | Login works, DB clean |
| Phase 2: Core Business | Wallets + Saving + AI + PayOS | E2E user flow passes |
| Phase 3: Polish & Deploy | Mobile UX + Admin + CI/CD + Monitoring | Production live |

---

## 11. Test Strategy

### 11.1 Unit Tests
- API: Jest/Vitest cho NestJS services
- Web: Vitest cho utilities, React Testing Library cho components
- Mobile: Jest cho Expo components

### 11.2 Integration Tests
- API endpoint tests (supertest)
- Database migration tests

### 11.3 E2E Tests
- Web: Playwright
- Mobile: Detox (optional, manual QA minimum)

### 11.4 Test Cases (from SRS v1)

| ID | Scenario | Input | Expected |
|---|---|---|---|
| TC-01 | Tạo kế hoạch tiết kiệm hợp lệ | Income=10M, Fixed=4M, Save=20% | Budget/ngày + tiết kiệm/tháng calculated |
| TC-02 | Thay đổi % tiết kiệm | 20% → 30% | Budget/ngày cập nhật tương ứng |
| TC-03 | Safe Money Basic | Mode=basic | Threshold auto-calculated cố định |
| TC-04 | Safe Money Advanced | Mode=advanced, sensitivity=high | Cảnh báo sớm khi chi tiêu tăng nhanh |
| TC-05 | AI giải thích | User hỏi "tại sao?" | AI trả lời ngôn ngữ tự nhiên, dễ hiểu |

---

_Document version: 2.0_
_Last updated: 2026-04-01_
_Status: Approved for implementation_
