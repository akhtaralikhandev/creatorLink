# CreatorLink Project Overview

CreatorLink is a full-stack web application for connecting brands with UGC creators. Brands can create campaigns, review creator applications, manage collaborations, approve submitted content, and track payments. Creators can browse campaigns, apply with pitches, manage their portfolio, submit work, and view earnings or notifications.

## Technologies Used

### Next.js 16

Next.js is the main application framework. This project uses the App Router, so pages, layouts, and API routes live inside the `app/` directory. It handles routing, server rendering, server components, API endpoints, and production builds.

### React 19

React is used to build the user interface. Pages and components are written as React components, with interactive parts such as forms, dialogs, buttons, toggles, and client-side actions handled through React.

### TypeScript

TypeScript adds static typing to JavaScript. It helps catch mistakes early by checking data shapes, function arguments, component props, and returned values before runtime.

### Tailwind CSS v4

Tailwind CSS is used for styling. Instead of writing large custom CSS files, components use utility classes for spacing, colors, typography, layout, borders, and responsive behavior.

### Radix UI

Radix UI provides accessible, unstyled UI primitives such as dialogs, dropdown menus, selects, tabs, tooltips, switches, avatars, and separators. The project wraps these primitives inside reusable components under `components/ui/`.

### shadcn-style Components

The UI components follow a shadcn-style pattern: reusable local components are stored in the repository rather than imported as a fixed external component library. This gives the app consistent buttons, cards, badges, inputs, dialogs, tabs, and form controls.

### Prisma 7

Prisma is the ORM used to communicate with the database. It defines the database schema in `prisma/schema.prisma` and provides a typed database client used in server actions and backend logic.

### PostgreSQL

PostgreSQL is the relational database. It stores users, brands, creators, campaigns, applications, collaborations, content submissions, payments, portfolio items, sessions, accounts, and notifications.

### NextAuth.js v5 / Auth.js

NextAuth handles authentication. This app uses a credentials login flow with email and password. Auth sessions use JWT strategy, and the authenticated user's role is stored in the session so the app can redirect and protect brand or creator routes.

### bcryptjs

bcryptjs hashes user passwords before saving them to the database. During login, the submitted password is compared with the hashed password instead of storing or checking plain text passwords.

### Zod

Zod validates input data on the server. Registration, login, campaign creation, applications, profile updates, portfolio items, and content submissions all use schemas from `lib/validations.ts`.

### React Hook Form

React Hook Form manages form state in the frontend. It works with Zod through `@hookform/resolvers` so forms can validate user input cleanly.

### Lucide React

Lucide React provides icons used across the interface, such as dashboard, notification, user, campaign, and action icons.

### date-fns

date-fns formats dates in a readable way for dashboards, cards, lists, and activity data.

### clsx and tailwind-merge

These utilities help combine conditional CSS class names safely. The shared `cn()` helper in `lib/utils.ts` uses them to merge Tailwind classes without conflicts.

## Main Application Flow

The core business flow is:

1. A user registers as either a brand or a creator.
2. The app creates a `User` record and a matching `Brand` or `Creator` profile.
3. A brand logs in and creates a campaign.
4. A creator browses active campaigns.
5. The creator applies to a campaign with an optional pitch.
6. The brand reviews the application.
7. If the application is rejected, the creator receives a notification.
8. If the application is accepted, the app creates a collaboration and payment record.
9. The creator submits content for the collaboration.
10. The brand reviews the submitted content.
11. If rejected, the creator receives feedback and can revise.
12. If approved, the collaboration is marked completed and payment is marked paid.

In short:

```text
Brand creates campaign
  -> Creator applies
    -> Brand accepts or rejects
      -> Accepted application creates collaboration
        -> Creator submits content
          -> Brand approves content
            -> Collaboration completes and payment is released
```

## User Roles

### Brand

A brand user can:

- View the brand dashboard.
- Create, edit, and delete its own campaigns.
- Review applications submitted to its campaigns.
- Accept or reject creator applications.
- View and manage collaborations created from accepted applications.
- Review submitted content.
- Approve content and trigger payment completion.
- View reports and notifications.
- Update brand profile data.

### Creator

A creator user can:

- View the creator dashboard.
- Browse active campaigns.
- Apply to campaigns with a pitch.
- Track submitted applications.
- View active and completed collaborations.
- Submit content links for active collaborations.
- Manage portfolio items.
- View earnings and payment status.
- View notifications.
- Update creator profile data.

## Backend Functionality

This project does not use a separate Express or Nest backend. The backend is built into Next.js through server actions, API routes, middleware, Prisma, and NextAuth.

### Authentication Backend

Important files:

- `lib/auth.ts`
- `auth.config.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `actions/auth.ts`
- `middleware.ts`

How it works:

1. Registration is handled by `registerUser()` in `actions/auth.ts`.
2. User input is validated with `registerSchema`.
3. Passwords are hashed with bcryptjs.
4. A `User` record is created.
5. Depending on the selected role, either a `Brand` or `Creator` profile is created.
6. Login is handled by NextAuth credentials provider in `lib/auth.ts`.
7. The submitted password is compared with the stored hash.
8. The session stores the user id and role.
9. `middleware.ts` protects private routes and redirects users based on role.

### Database Backend

Important files:

- `prisma/schema.prisma`
- `lib/db.ts`
- `prisma/seed.ts`

The Prisma schema defines the database models and relationships. `lib/db.ts` creates a Prisma client using the PostgreSQL adapter and reuses the same client during development to avoid too many database connections.

Main database entities:

- `User`: base account record for every user.
- `Brand`: brand profile linked to a user.
- `Creator`: creator profile linked to a user.
- `Campaign`: campaign created by a brand.
- `Application`: creator application to a campaign.
- `Collaboration`: accepted application turned into a work agreement.
- `ContentSubmission`: creator-submitted content for a collaboration.
- `Payment`: payment record for a collaboration.
- `PortfolioItem`: creator portfolio media.
- `Notification`: user notification messages.

### Server Actions

Server actions are backend functions called from the app without creating a traditional REST endpoint for every operation.

Important files:

- `actions/campaigns.ts`
- `actions/applications.ts`
- `actions/collaborations.ts`
- `actions/profile.ts`
- `actions/notifications.ts`
- `actions/auth.ts`

Responsibilities:

- `campaigns.ts`: create, update, and delete brand campaigns.
- `applications.ts`: creator applies to campaign, brand reviews applications.
- `collaborations.ts`: creator submits content, brand reviews submissions.
- `profile.ts`: update brand profile, update creator profile, manage portfolio items.
- `notifications.ts`: mark one or all notifications as read.
- `auth.ts`: register new users and create matching role profile.

Every important server action checks authentication with `auth()`, verifies the user role, validates input with Zod, and confirms record ownership before changing database data.

### API Routes

Important files:

- `app/api/auth/[...nextauth]/route.ts`
- `app/api/campaigns/[id]/route.ts`

The auth API route exposes the NextAuth handlers. The campaign API route is used for campaign-specific backend behavior where a route handler is preferred over a server action.

### Middleware

Important file:

- `middleware.ts`

Middleware runs before protected pages load. It allows public routes like `/`, `/login`, `/register`, and `/api/auth`. For private routes, it checks the session and redirects unauthenticated users to login.

Role-based routing rules:

- Brand routes start with `/brand`.
- Creator routes start with `/creator`.
- Brand users are redirected away from creator pages.
- Creator users are redirected away from brand pages.
- Authenticated users visiting login or register are redirected to their dashboard.

## Code Structure

```text
creatorlink/
  app/
    brand/
      dashboard/
      campaigns/
      applications/
      collaborations/
      reports/
      notifications/
    creator/
      dashboard/
      browse/
      applications/
      collaborations/
      portfolio/
      earnings/
      notifications/
    api/
      auth/
      campaigns/
    login/
    register/
    layout.tsx
    page.tsx
    providers.tsx
    globals.css

  actions/
    auth.ts
    campaigns.ts
    applications.ts
    collaborations.ts
    profile.ts
    notifications.ts

  components/
    ui/
    shared/

  lib/
    auth.ts
    db.ts
    notifications.ts
    utils.ts
    validations.ts

  prisma/
    schema.prisma
    seed.ts

  types/
    next-auth.d.ts

  middleware.ts
  auth.config.ts
  package.json
```

## Frontend Structure

### `app/`

The `app/` directory contains all pages and layouts. It is divided by role:

- `app/brand/`: brand dashboard and brand-only workflows.
- `app/creator/`: creator dashboard and creator-only workflows.
- `app/login/`: login screen.
- `app/register/`: registration screen.
- `app/api/`: backend route handlers.

### `components/ui/`

This folder contains low-level reusable UI components such as:

- Button
- Card
- Badge
- Input
- Textarea
- Dialog
- Select
- Tabs
- Tooltip
- Avatar
- Dropdown menu

These components are generic and can be reused anywhere.

### `components/shared/`

This folder contains app-specific reusable components such as:

- `AppShell`: common layout shell for authenticated pages.
- `PageHeader`: reusable page heading area.
- `StatCard`: dashboard stat display.
- `EntityCard`: reusable card for campaigns, applications, or related data.
- `StatusBadge`: consistent status labels.
- `FilterBar`: filtering UI.
- `NotificationItem`: notification display.
- `ThemeToggle`: dark and light mode toggle.
- `UserAvatar`: user avatar display.

## Main Features

### Registration and Login

Users can register as either a brand or creator. The app creates the correct profile type during registration. Login uses email and password authentication.

### Role-Based Dashboards

Brands and creators have separate dashboards. Each dashboard shows data relevant to that role, such as campaigns, applications, collaborations, payments, and notifications.

### Campaign Management

Brands can create campaigns with title, description, budget, niche, status, and cover image. They can update or delete only their own campaigns.

### Campaign Browsing

Creators can browse active campaigns and apply to campaigns that are available.

### Applications

Creators submit applications to campaigns. A unique database constraint prevents the same creator from applying to the same campaign more than once.

### Application Review

Brands can accept or reject applications for their own campaigns. Accepting an application automatically creates a collaboration and payment record.

### Collaborations

Collaborations represent active work between a brand and creator. They are created only after an application is accepted.

### Content Submission

Creators submit content by providing a video URL and optional caption. The submission is linked to a collaboration.

### Content Review

Brands approve or reject submitted content. Approval completes the collaboration and marks the payment as paid. Rejection stores feedback and notifies the creator.

### Payments and Earnings

Payment records are created when a collaboration starts. They move from `PENDING` to `PAID` after a brand approves the creator's content.

### Portfolio

Creators can add or delete portfolio items. Portfolio items can be images or videos and help brands understand a creator's previous work.

### Notifications

The app creates notifications for important workflow events, including new applications, accepted or rejected applications, received submissions, and approved or rejected submissions.

## Data Relationships

```text
User
  -> Brand
    -> Campaign
      -> Application
        -> Collaboration
          -> ContentSubmission
          -> Payment

User
  -> Creator
    -> Application
    -> PortfolioItem

User
  -> Notification
```

Important constraints:

- One user can have one brand profile or one creator profile.
- One brand can create many campaigns.
- One creator can apply to many campaigns.
- One campaign can receive many applications.
- One application can create one collaboration.
- One collaboration can have many content submissions.
- One collaboration has one payment.
- One creator can have many portfolio items.
- One user can have many notifications.

## Security and Validation

The app uses several layers of protection:

- Route protection in `middleware.ts`.
- Role checks in server actions.
- Ownership checks before updates and deletes.
- Zod validation before database writes.
- Password hashing with bcryptjs.
- Prisma typed database queries.
- Database uniqueness constraints for key business rules.
- JWT sessions with user id and role.

## Environment and Scripts

Main environment variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: secret used by NextAuth.
- `NEXTAUTH_URL`: local or deployed app URL.

Useful scripts:

```text
npm run dev          Start the development server.
npm run build        Build the app for production.
npm run start        Start the production server.
npm run lint         Run ESLint.
npm run db:generate  Generate Prisma client.
npm run db:push      Push Prisma schema to the database.
npm run db:migrate   Create and run a Prisma migration.
npm run db:seed      Seed the database with demo data.
npm run db:studio    Open Prisma Studio.
npm run db:reset     Reset and reseed the database.
```

## Summary

CreatorLink is a role-based marketplace application built with Next.js, React, TypeScript, Prisma, PostgreSQL, and NextAuth. The frontend is organized around brand and creator workflows, while the backend uses server actions, Prisma models, authentication callbacks, middleware, and validation schemas to enforce the business flow from campaign creation to creator payment.
