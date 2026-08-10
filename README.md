# Autoshkolla

Aplikacion full-stack për menaxhimin e një autoshkolle: rezervim orësh praktike, test teorie adaptiv, dhe progress-tracking për studentët.

## Struktura

```
autoshkolle/
  backend/    Express + TypeScript + Prisma (API)
  frontend/   Next.js 16 + Tailwind v4 (UI)
```

## Setup lokal

### 1. NeonDB

Krijo një projekt në [Neon](https://neon.tech), pastaj brenda tij dy **branch**-e (`production` dhe `development`). Kopjo connection string-un e pooled (`...-pooler.../...?sslmode=require&pgbouncer=true`) për `DATABASE_URL`, dhe atë direkt (jo-pooled) për `DIRECT_URL`.

### 2. Backend

```bash
cd backend
cp .env.example .env      # vendos DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npx prisma migrate dev --name init   # krijon tabelat në NeonDB
npm run seed                          # ~100 pyetje teorie + përdorues demo
npm run dev                           # http://localhost:4000
```

Kredencialet demo pas seed-it (fjalëkalimi për të gjithë: `Test1234`):
- Admin: `admin@autoshkolla.demo`
- Instruktor: `instruktor1@autoshkolla.demo`, `instruktor2@autoshkolla.demo`
- Student: `elira.gashi@student.demo` (+ 4 studentë të tjerë demo)

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                        # http://localhost:3000
```

## Çka është implementuar deri tani

- **Schema Prisma** e plotë (12 modelet, enums, unique constraints, indexe)
- **Auth**: regjistrim/hyrje me JWT, role-based (ADMIN/INSTRUCTOR/STUDENT)
- **Booking i orëve**: race-safe me `updateMany({ iZene: false })` brenda transaksioni — dy studentë s'mund të zënë të njëjtin slot njëkohësisht
- **Quiz engine**: gjenerim adaptiv (peshon kategoritë ku studenti ka gabuar më shumë), submit + scoring, historia
- **Progress tracking**: % orësh, mesatarja e aftësive, gatishmëria (semafor jeshil/verdhë/kuq)
- **Seed**: 100 pyetje teorie (5 kategori × 20), 6 kategori aftësish, 2 instruktorë, 5 studentë, disponueshmëri për 10 ditë
- **Frontend minimal funksional**: login/register, dashboard studenti (progress ring + orët e ardhshme), rezervim ore (kalendar disponueshmërie), quiz interface (timer, progres, rezultat me breakdown sipas kategorive)

## Çka mbetet (jashtë shtrirjes së parë)

- Faqet e Instruktorit (orari, vlerësimi pas ore) dhe Admin (dashboard, CRUD pyetjesh)
- Dizajn "premium" (micro-interactions, dark mode toggle, komponentë të personalizuar plotësisht — aktualisht janë komponentë bazë Tailwind, jo shadcn/ui)
- Grafiku radar/bar për aftësitë (recharts është instaluar, gati për t'u përdorur)
- Integrimi SMTP për njoftimet 24h (cron job-i ekziston në `backend/src/index.ts`, mungon vetëm dërgimi real i email-it)
- i18n (aktualisht vetëm shqip, i kabluar direkt në UI — jo ende i ndarë në fajlla përkthimi)

## Deployment

**Backend → Render**: Web Service i ri, build command `npm run build`, start command `npm start`. Env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL i Vercel-it). Shto `prisma migrate deploy` si build step (ose `postinstall`) në vend të `migrate dev`.

**Frontend → Vercel**: Lidh repo-n, env var `NEXT_PUBLIC_API_URL` = URL i backend-it në Render.

**CORS**: backend lexon origin-et e lejuara nga `CORS_ORIGIN` (të ndara me presje nëse ka disa).
