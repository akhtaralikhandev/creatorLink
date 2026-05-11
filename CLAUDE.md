# CreatorLink — Claude Code Instructions

## Project Overview

CreatorLink is a full-stack Next.js UGC creator marketplace. Brands post campaigns, creators apply, brands manage collaborations, creators submit content, and payments are tracked.

---

## Build Execution Plan

When implementing features or extending this codebase, follow this sequence:

1. **Prisma schema first** — add/modify models in `prisma/schema.prisma`, run `npm run db:generate` and `npm run db:push`
2. **Auth & middleware** — update `lib/auth.ts` and `middleware.ts` for any new protected routes
3. **Design system** — add new tokens to `app/globals.css` `:root` and `.dark`, map in `@theme inline`
4. **Dark/light mode** — verify new components use only CSS variable-based classes (no hardcoded colors)
5. **Reusable components** — add to `components/ui/` (primitives) or `components/shared/` (feature components)
6. **Server actions** — add to `actions/` with Zod validation + auth check + role guard
7. **Pages** — create in `app/brand/` or `app/creator/` as server components; use client components only for interactive parts
8. **Seed** — update `prisma/seed.ts` if new entities need demo data
9. **README** — keep README.md updated with any new features, routes, or setup steps

---

## Architecture Rules

- **No hardcoded colors** — always use CSS variable tokens (`bg-primary`, `text-muted-foreground`, etc.)
- **Server components by default** — use `"use client"` only for interactive/stateful UI
- **Every server action must call `auth()` first** — verify session + role + resource ownership
- **Zod validates all inputs** — no raw DB writes without validation
- **Prisma ownership checks** — never trust client-supplied IDs without verifying they belong to the authenticated user

---

## Key Files

| File | Purpose |
|---|---|
| `app/globals.css` | **Single source of truth for all colors and design tokens** |
| `lib/auth.ts` | NextAuth config, JWT callbacks, session shape |
| `lib/db.ts` | Prisma singleton |
| `lib/validations.ts` | All Zod schemas |
| `lib/notifications.ts` | Notification creation helper |
| `middleware.ts` | Route protection, role-based redirects |
| `prisma/schema.prisma` | Full database schema |
| `prisma/seed.ts` | Demo data (10 users, 8 campaigns, 15 applications...) |
| `components/shared/AppShell.tsx` | Main layout wrapper with sidebar nav |

---

## Tech Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 (uses `@theme inline` — NOT `tailwind.config.js`)
- Radix UI primitives (shadcn-style custom components)
- Prisma 7 + PostgreSQL
- NextAuth.js v5 beta (JWT sessions, credentials provider)
- Zod + React Hook Form
- bcryptjs (12 rounds)

---

## Demo Credentials

Password: `demo1234` for all accounts

- Brand: `brand@demo.com` (StyleHouse, Fashion)
- Creator: `creator@demo.com` (Ava Martinez, Fashion)

---

## Common Commands

```bash
npm run dev           # dev server
npm run db:push       # push schema changes
npm run db:seed       # reseed demo data
npm run db:studio     # Prisma Studio
npm run db:reset      # full reset + reseed
```
