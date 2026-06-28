# اكاديمية مستر مصطفى — LMS Platform

منصة تعليمية متكاملة لتدريس اللغة العربية، مبنية بـ Next.js 14، TypeScript، TailwindCSS، Prisma، PostgreSQL.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your database URL and JWT secret
```

### 3. Set up database
```bash
npx prisma db push        # create tables
npx prisma db seed        # create owner account + demo data
```

### 4. Run development server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔑 Default Login

After seeding, login with:
- **Phone:** `01000000000`
- **Password:** `owner1234`

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── (auth)/           # Login + Register pages
│   ├── (student)/        # Student dashboard, courses, lectures
│   ├── (admin)/          # Admin panel
│   ├── (owner)/          # Owner CMS
│   └── api/              # REST API routes
├── components/
│   ├── auth/             # Login/Register forms
│   ├── courses/          # VideoPlayer, PDFViewer
│   ├── dashboard/        # WelcomeAnimation, DashboardStats
│   ├── landing/          # Hero, Features, Teacher, CTA
│   ├── layout/           # Sidebar, PageTransition
│   └── ui/               # StatCard, Toast
├── hooks/                # useAuth, useCourses, useProgress
├── lib/                  # auth, bcrypt, prisma, utils, validations
├── store/                # Zustand: authStore, uiStore, customizeStore
└── types/                # Global TypeScript types
```

---

## 📚 Features

| Feature | Description |
|---|---|
| **Auth** | Phone-number login only, JWT, bcrypt, role-based |
| **Roles** | Owner / Admin / Student |
| **Academic Levels** | First / Second / Third Secondary — course filtering |
| **Courses** | Full CRUD, per-level assignment, publish toggle |
| **Lectures** | Many-to-many course linking (one lecture → many courses) |
| **Videos** | Protected YouTube embed, URL obfuscation, right-click disabled |
| **PDFs** | Upload links + inline viewer |
| **Quizzes** | Visual builder, image-based MCQs, auto-grading |
| **Homework** | Visual builder, image questions |
| **Access Codes** | Single-use, expiry, batch generate, printable A4 cards |
| **Owner CMS** | Visual settings panel — edit all text/colors without code |
| **Animations** | Framer Motion throughout — welcome sequence, stagger, counters |
| **RTL** | Full Arabic RTL layout |

---

## 🗄️ Database Schema (Key Relations)

```
User ──────────────── AccessCode (redeemed)
Course ◄──────────── CourseOnLevel (many-to-many)
Course ◄──────────── CourseLecture (many-to-many)
Lecture ──────────── Video / PDF / Quiz / Homework
Quiz / Homework ───── Question ───── Choice
AccessCode ◄──────── CourseOnCode (many-to-many)
```

---

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel dashboard
3. Add environment variables:
   - `DATABASE_URL` — your PostgreSQL connection string (Supabase, Neon, Railway, etc.)
   - `JWT_SECRET` — random 64+ char string
   - `NEXT_PUBLIC_APP_URL` — your Vercel domain
4. Deploy — Vercel auto-runs `next build`
5. Run seed once via Vercel CLI or database dashboard

```bash
# Recommended: Neon.tech free PostgreSQL
# DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

---

## 📱 Roles & Access

| Route | Owner | Admin | Student |
|---|---|---|---|
| `/` | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ |
| `/admin/*` | ✅ | ✅ | ❌ |
| `/owner/*` | ✅ | ❌ | ❌ |

---

## 🎨 Design System

- **Gold:** `#C9A84C` — primary accent
- **Emerald:** `#1A6B47` — backgrounds, headers
- **Cream:** `#FAF7F0` — page background
- **Ink:** `#1A1208` — text
- **Fonts:** Amiri (headings), Cairo / Tajawal (body)

---

## 📋 Available Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # production server
npm run db:push      # sync schema to database
npm run db:seed      # seed demo data
npm run db:studio    # open Prisma Studio
npm run db:generate  # regenerate Prisma client
```
