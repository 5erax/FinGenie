# FinGenie

Ung dung quan ly tai chinh ca nhan tich hop AI, gamification va thanh toan truc tuyen.

## Kien truc du an

```
fingenie/
├── apps/
│   ├── web/          # Next.js 15 — Landing page & Web app
│   ├── api/          # NestJS 11 — REST API backend
│   └── mobile/       # Expo 55 + React Native — Mobile app
├── packages/
│   ├── database/     # Prisma ORM — Schema & migrations
│   └── shared-types/ # TypeScript types dung chung
├── turbo.json        # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

## Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind CSS 4   |
| Mobile   | Expo 55, React Native 0.83, NativeWind |
| Backend  | NestJS 11, Prisma 6, PostgreSQL        |
| Auth     | Firebase Authentication                |
| AI       | Google Gemini (gemini-2.0-flash)       |
| Payment  | PayOS                                  |
| Database | PostgreSQL (Supabase hosted)           |
| Monorepo | Turborepo + pnpm                       |

---

## Yeu cau he thong

- **Node.js** >= 20.0.0
- **pnpm** >= 10.33.0
- **PostgreSQL** 15+ (hoac Supabase)
- **Firebase Project** (Authentication)
- **Expo CLI** (cho mobile dev)

---

## Huong dan cai dat & chay du an

### 1. Clone repository

```bash
git clone https://github.com/<your-org>/fingenie.git
cd fingenie
```

### 2. Cai dat dependencies

```bash
pnpm install
```

### 3. Cau hinh environment variables

#### a) Database (`packages/database/.env`)

```bash
cp packages/database/.env.example packages/database/.env
```

Sua file `packages/database/.env`:

```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/fingenie?schema=public"

# Hoac Supabase hosted:
# DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

#### b) API (`apps/api/.env`)

```bash
cp apps/api/.env.example apps/api/.env
```

Sua file `apps/api/.env`:

```env
# ─── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://postgres:password@localhost:5432/fingenie?schema=public"

# ─── Firebase Admin SDK ─────────────────────────────────
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# ─── Admin Seed ─────────────────────────────────────────
ADMIN_FIREBASE_UID="admin-firebase-uid-here"
ADMIN_EMAIL="admin@fingenie.vn"
ADMIN_DISPLAY_NAME="FinGenie Admin"

# ─── Gemini AI ───────────────────────────────────────────
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash"

# ─── Server ─────────────────────────────────────────────
PORT=4000

# ─── PayOS ──────────────────────────────────────────────
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYMENT_RETURN_URL=fingenie://payment/success
PAYMENT_CANCEL_URL=fingenie://payment/cancel
```

### 4. Khoi tao database

```bash
# Generate Prisma client
pnpm --filter @fingenie/database db:generate

# Chay migrations (tao tables)
pnpm --filter @fingenie/database db:migrate

# (Tuy chon) Seed du lieu mau
pnpm --filter @fingenie/database db:seed
```

### 5. Chay du an (Development)

#### Chay tat ca cung luc (Turborepo)

```bash
pnpm dev
```

Lenh nay se dong thoi khoi dong:

- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **Mobile**: Expo DevTools

#### Chay tung app rieng le

```bash
# Chi chay Web
pnpm --filter @fingenie/web dev

# Chi chay API
pnpm --filter @fingenie/api dev

# Chi chay Mobile
pnpm --filter @fingenie/mobile dev
```

### 6. Cac lenh huu ich khac

```bash
# Build tat ca apps
pnpm build

# Lint tat ca apps
pnpm lint

# Typecheck tat ca apps
pnpm typecheck

# Format code
pnpm format

# Mo Prisma Studio (quan ly DB bang GUI)
pnpm --filter @fingenie/database db:studio

# Reset database (xoa het data + chay lai migrations)
pnpm --filter @fingenie/database db:reset

# Chay tests (API)
pnpm --filter @fingenie/api test
pnpm --filter @fingenie/api test:watch
pnpm --filter @fingenie/api test:e2e
```

---

## Huong dan Deploy

### 1. Database — Supabase

1. Tao project tren [Supabase](https://supabase.com)
2. Lay connection string tu **Settings > Database > Connection string**
3. Cap nhat `DATABASE_URL` va `DIRECT_URL` trong `.env`:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

4. Deploy schema len Supabase:

```bash
pnpm --filter @fingenie/database db:migrate:deploy
```

---

### 2. API (NestJS) — Railway / Render / VPS

#### Option A: Railway

1. Truy cap [Railway](https://railway.app), tao project moi
2. Connect GitHub repo, chon folder `apps/api`
3. Cau hinh:
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @fingenie/database db:generate && pnpm --filter @fingenie/api build`
   - **Start Command**: `cd apps/api && node dist/main`
   - **Root Directory**: `/` (root cua monorepo)
4. Them tat ca environment variables tu `apps/api/.env.example`
5. Deploy

#### Option B: Render

1. Truy cap [Render](https://render.com), tao **Web Service**
2. Connect GitHub repo
3. Cau hinh:
   - **Root Directory**: (de trong)
   - **Build Command**: `pnpm install && pnpm --filter @fingenie/database db:generate && pnpm --filter @fingenie/api build`
   - **Start Command**: `node apps/api/dist/main`
4. Them environment variables trong tab **Environment**
5. Deploy

#### Option C: VPS (Ubuntu)

```bash
# 1. Clone repo tren server
git clone https://github.com/<your-org>/fingenie.git
cd fingenie

# 2. Cai dat Node.js 20+ va pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 3. Cai dependencies va build
pnpm install
pnpm --filter @fingenie/database db:generate
pnpm --filter @fingenie/database db:migrate:deploy
pnpm --filter @fingenie/api build

# 4. Cau hinh .env
cp apps/api/.env.example apps/api/.env
nano apps/api/.env  # Sua cac gia tri

# 5. Chay bang PM2
npm install -g pm2
pm2 start apps/api/dist/main.js --name fingenie-api
pm2 save
pm2 startup
```

**Cau hinh Nginx (reverse proxy):**

```nginx
server {
    listen 80;
    server_name api.fingenie.vn;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Cai SSL voi Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.fingenie.vn
```

---

### 3. Web (Next.js) — Vercel

1. Truy cap [Vercel](https://vercel.com), import GitHub repo
2. Cau hinh:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @fingenie/web build`
   - **Output Directory**: `apps/web/.next`
3. Them environment variables (neu co, vd: API URL)
4. Deploy — Vercel tu dong cap nhat khi push code

---

### 4. Mobile (Expo) — EAS Build

#### Cai dat EAS CLI

```bash
npm install -g eas-cli
eas login
```

#### Cau hinh EAS (neu chua co `eas.json`)

```bash
cd apps/mobile
eas build:configure
```

#### Build APK/IPA

```bash
# Build Android (APK/AAB)
cd apps/mobile
eas build --platform android --profile preview   # APK de test
eas build --platform android --profile production # AAB cho Google Play

# Build iOS
eas build --platform ios --profile production     # IPA cho App Store
```

#### Submit len Store

```bash
# Google Play
eas submit --platform android

# App Store
eas submit --platform ios
```

#### OTA Update (cap nhat khong can build lai)

```bash
cd apps/mobile
eas update --branch production --message "Fix bug XYZ"
```

---

## Cau truc Environment Variables

| Bien                    | App | Mo ta                        | Bat buoc |
| ----------------------- | --- | ---------------------------- | -------- |
| `DATABASE_URL`          | API | PostgreSQL connection string | Co       |
| `DIRECT_URL`            | DB  | Direct connection (Supabase) | Khong    |
| `FIREBASE_PROJECT_ID`   | API | Firebase project ID          | Co       |
| `FIREBASE_CLIENT_EMAIL` | API | Firebase admin email         | Co       |
| `FIREBASE_PRIVATE_KEY`  | API | Firebase admin private key   | Co       |
| `GEMINI_API_KEY`        | API | Google Gemini API key        | Co       |
| `GEMINI_MODEL`          | API | Gemini model name            | Khong    |
| `PORT`                  | API | Server port (default: 4000)  | Khong    |
| `PAYOS_CLIENT_ID`       | API | PayOS client ID              | Co       |
| `PAYOS_API_KEY`         | API | PayOS API key                | Co       |
| `PAYOS_CHECKSUM_KEY`    | API | PayOS checksum key           | Co       |

---

## API Documentation

Khi API dang chay, truy cap Swagger docs tai:

```
http://localhost:4000/api
```

---

## Troubleshooting

### Loi Prisma Client khong tim thay

```bash
pnpm --filter @fingenie/database db:generate
```

### Loi port da duoc su dung

```bash
# Tim process dang dung port
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :4000
kill -9 <PID>
```

### Loi pnpm version khong dung

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

### Loi Expo khong connect duoc

```bash
cd apps/mobile
npx expo start --clear
```

---

## License

Private — All rights reserved.
