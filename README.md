# CreatorLink — UGC Creator Marketplace

A full-stack SaaS platform connecting brands with UGC creators. Built as a database systems course project demonstrating real-world relational database design, role-based access control, and end-to-end workflow management.

---

## App Overview

CreatorLink enables brands to post campaigns, discover creators, manage collaborations, and track payments — all in a single platform. Creators browse opportunities, apply with pitches, submit content, and get paid.

**Core flow:**
```
Brand creates campaign
  → Creator browses & applies
    → Brand reviews & accepts/rejects
      → Accepted → Collaboration created
        → Creator submits content
          → Brand approves → Payment released
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI + custom shadcn-style components |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | NextAuth.js v5 (Auth.js) |
| Validation | Zod |
| Forms | React Hook Form + @hookform/resolvers |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge, date-fns |

---

## Folder Structure

```
creatorlink/
├── app/
│   ├── brand/         brand-role pages (dashboard, campaigns, applications, collaborations, reports, notifications)
│   ├── creator/       creator-role pages (dashboard, browse, applications, collaborations, portfolio, earnings, notifications)
│   ├── login/         sign-in page
│   ├── register/      sign-up page with role selector
│   ├── api/auth/      NextAuth route handlers
│   ├── layout.tsx     root layout + font + providers
│   ├── page.tsx       landing page
│   └── providers.tsx  SessionProvider + theme initializer
│
├── actions/           server actions (auth, campaigns, applications, collaborations, profile, notifications)
│
├── components/
│   ├── ui/            low-level primitives (Button, Card, Badge, Input, Dialog, Select, Tabs, etc.)
│   └── shared/        design system components (AppShell, PageHeader, StatCard, EmptyState, EntityCard, SectionCard, StatusBadge, FilterBar, NotificationItem, UserAvatar, ThemeToggle)
│
├── lib/
│   ├── auth.ts        NextAuth config + JWT callbacks
│   ├── db.ts          Prisma singleton
│   ├── utils.ts       cn, formatCurrency, formatDate, getInitials, etc.
│   ├── validations.ts Zod schemas for all entities
│   └── notifications.ts notification creation helper
│
├── types/             TypeScript declaration extensions (next-auth.d.ts)
├── prisma/
│   ├── schema.prisma  full database schema (10 models)
│   └── seed.ts        realistic demo data seed script
│
├── middleware.ts      route protection + role-based redirects
├── .env               local environment (gitignored)
└── .env.example       environment template
```

---

## ERD Summary

```
User (1) ──── (1) Brand ──── (N) Campaign ──── (N) Application
                                                      │
User (1) ──── (1) Creator ── (N) Application         │
                   │                                  ▼
                   └── (N) PortfolioItem     (1) Collaboration ─── (N) ContentSubmission
                                                      │
User (1) ──── (N) Notification               (1) Payment
```

**10 entities:** User, Brand, Creator, Campaign, Application, Collaboration, ContentSubmission, Payment, PortfolioItem, Notification

**Key constraints:**
- `Application` has `UNIQUE(campaignId, creatorId)` — prevents duplicate applications
- `Collaboration` has `UNIQUE(applicationId)` — one collab per accepted application
- `Payment` has `UNIQUE(collaborationId)` — one payment per collaboration

---

## Role Permissions

| Action | Brand | Creator |
|---|---|---|
| Create/edit/delete campaigns | ✅ own only | ❌ |
| Browse active campaigns | ❌ | ✅ |
| Apply to campaigns | ❌ | ✅ own only |
| Accept/reject applications | ✅ own campaigns only | ❌ |
| Submit content | ❌ | ✅ own collabs only |
| Approve/reject submissions | ✅ own collabs only | ❌ |
| View payment status | ✅ own | ✅ own |
| View admin reports | ✅ | ❌ |
| Manage portfolio | ❌ | ✅ own |
| View notifications | ✅ own | ✅ own |

---

## How Theming Works

All semantic colors are defined as CSS custom properties in `app/globals.css` under `:root` (light) and `.dark`. They are mapped to Tailwind utility classes via `@theme inline`.

**To rebrand:** change the HSL values at the top of `globals.css`. Everything updates automatically.

```css
/* Example: change primary from indigo to teal */
--primary: 173 80% 40%;   /* was: 243 75% 59% */
```

**Semantic tokens available:**
`--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--card`, `--success`, `--warning`, `--destructive`, `--info`, `--surface-1/2/3`, `--sidebar`, `--sidebar-accent`

No hardcoded hex/rgb colors in any component.

---

## Dark / Light Mode

- Toggled by the `ThemeToggle` button in the top bar of every page
- Persisted to `localStorage` key `"theme"`
- On mount, reads `localStorage` and applies `.dark` class to `<html>`
- `suppressHydrationWarning` on `<html>` prevents SSR mismatch
- All CSS variables have both `:root` (light) and `.dark` overrides

---

## Security Notes

- All protected routes guarded by `middleware.ts` — unauthenticated users redirected to `/login`
- Every server action calls `auth()` and verifies user role before any DB operation
- Brand actions verify campaign/application ownership via `brandId` check
- Creator actions verify ownership via `creatorId` check
- Zod validates all inputs server-side before touching the database
- Prisma's typed queries prevent SQL injection by design
- Passwords hashed with bcryptjs (12 rounds)
- No sensitive data exposed to client-side components
- `UNIQUE` constraints at DB level enforce business rules at the data layer

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (local or cloud, e.g. Supabase / Neon)

### 1. Install dependencies
```bash
cd creatorlink
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/creatorlink"
AUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Set up the database
```bash
npm run db:generate    # generate Prisma client
npm run db:push        # push schema to database
npm run db:seed        # populate with demo data
```

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

**Password for all accounts: `demo1234`**

### Brands

| Email | Company | Industry |
|---|---|---|
| `brand@demo.com` | StyleHouse | Fashion |
| `brand2@demo.com` | TechVibe | Technology |
| `brand3@demo.com` | GreenEarth | Sustainability |

### Creators

| Email | Name | Niche | Country |
|---|---|---|---|
| `creator@demo.com` | Ava Martinez | Fashion | United States |
| `creator2@demo.com` | Jake Chen | Technology | Canada |
| `creator3@demo.com` | Sofia Patel | Lifestyle | United Kingdom |
| `creator4@demo.com` | Marcus Williams | Fitness | Australia |
| `creator5@demo.com` | Emma Thompson | Food | United States |

---

## Seeded Data Summary

| Entity | Count | Notes |
|---|---|---|
| Users | 8 (3 brands + 5 creators) | |
| Brands | 3 | Fashion, Technology, Sustainability |
| Creators | 5 | Fashion, Tech, Lifestyle, Fitness, Food |
| Campaigns | 8 | 5 ACTIVE · 1 DRAFT · 2 CLOSED |
| Applications | 10 | 6 ACCEPTED · 2 PENDING · 1 REJECTED |
| Collaborations | 6 | 4 ACTIVE · 2 COMPLETED |
| Content Submissions | 5 | 3 APPROVED · 1 PENDING · 1 REJECTED |
| Payments | 3 | 2 PAID · 1 PENDING |
| Portfolio Items | 12 | 2–3 per creator (images + videos) |
| Notifications | 8 | Mix of read/unread across roles |

### Campaign Details

| Title | Brand | Status | Budget |
|---|---|---|---|
| Summer Collection 2025 Launch | StyleHouse | ACTIVE | $5,000 |
| Back to School Streetwear | StyleHouse | ACTIVE | $3,000 |
| Holiday Gift Guide | StyleHouse | DRAFT | $2,500 |
| ProBuds X Earbuds Review | TechVibe | ACTIVE | $4,000 |
| MagCharge Stand Launch | TechVibe | CLOSED | $2,000 |
| Zero Waste Kitchen Bundle | GreenEarth | ACTIVE | $1,800 |
| Sustainable Living Series | GreenEarth | ACTIVE | $3,500 |
| Earth Day Campaign | GreenEarth | CLOSED | $2,200 |

### Collaboration & Payment Details

| Creator | Campaign | Agreed Rate | Collab Status | Payment |
|---|---|---|---|---|
| Ava Martinez | Summer Collection 2025 Launch | $1,200 | ACTIVE | — |
| Jake Chen | ProBuds X Earbuds Review | $1,500 | ACTIVE | PENDING |
| Jake Chen | MagCharge Stand Launch | $800 | COMPLETED | PAID |
| Sofia Patel | Zero Waste Kitchen Bundle | $900 | ACTIVE | — |
| Sofia Patel | Sustainable Living Series | $1,800 | ACTIVE | — |
| Jake Chen | Earth Day Campaign | $1,000 | COMPLETED | PAID |

---

## Available Scripts

```bash
npm run dev           # start dev server (http://localhost:3000)
npm run build         # production build
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:push       # push schema to DB without migration files
npm run db:migrate    # create + run migration (production-style)
npm run db:seed       # populate demo data
npm run db:studio     # open Prisma Studio (visual DB browser)
npm run db:reset      # reset DB + reseed from scratch
```
#   c r e a t o r L i n k  
 