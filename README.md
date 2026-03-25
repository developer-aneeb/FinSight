# FinSight Backend

Next.js Route Handler + TypeScript backend for the FinSight AI-Powered Personal Finance Manager.

## Architecture

```
backend/
├── app/
│   └── api/v1/           # Next.js API route handlers
├── config/               # Environment, Supabase, ElasticSearch, Email
├── helpers/              # Date and utility helpers
├── errors/               # Shared HTTP/API error types
├── services/             # Business logic layer (10 services)
├── types/                # TypeScript interfaces & types
├── utils/                # Logger, validation schemas, constants
├── modules/              # Module organization placeholder
├── middleware/           # Middleware placeholder
├── policies/             # Authorization policies placeholder
├── rbac/                 # RBAC artifacts placeholder
├── tracing/              # Tracing assets placeholder
├── logs/                 # Runtime logs
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint                    | Auth | Description                  |
|--------|-----------------------------|------|------------------------------|
| GET    | `/health`                   | No   | Health check                 |
| POST   | `/auth/signup`              | No   | Sign up                      |
| POST   | `/auth/login`               | No   | Sign in                      |
| POST   | `/auth/logout`              | Yes  | Sign out                     |
| GET    | `/auth/profile`             | Yes  | Get user profile             |
| PUT    | `/auth/profile`             | Yes  | Update profile               |
| POST   | `/auth/reset-password`      | No   | Request password reset       |
| GET    | `/transactions`             | Yes  | List transactions (filtered) |
| GET    | `/transactions/summary/monthly` | Yes | Monthly summary          |
| GET    | `/transactions/:id`         | Yes  | Get single transaction       |
| POST   | `/transactions`             | Yes  | Create transaction           |
| PUT    | `/transactions/:id`         | Yes  | Update transaction           |
| DELETE | `/transactions/:id`         | Yes  | Delete transaction           |
| GET    | `/budgets`                  | Yes  | List budgets                 |
| GET    | `/budgets/active`           | Yes  | Active budgets with usage    |
| GET    | `/budgets/:id`              | Yes  | Get single budget            |
| POST   | `/budgets`                  | Yes  | Create budget                |
| PUT    | `/budgets/:id`              | Yes  | Update budget                |
| DELETE | `/budgets/:id`              | Yes  | Delete budget                |
| GET    | `/categories`               | Yes  | List system + user categories|
| POST   | `/categories`               | Yes  | Create custom category       |
| PUT    | `/categories/:id`           | Yes  | Update category              |
| DELETE | `/categories/:id`           | Yes  | Delete custom category       |
| GET    | `/categories/tags`          | Yes  | List tags                    |
| POST   | `/categories/tags`          | Yes  | Create tag                   |
| DELETE | `/categories/tags/:id`      | Yes  | Delete tag                   |
| GET    | `/analytics/dashboard`      | Yes  | Dashboard summary            |
| GET    | `/analytics/detailed`       | Yes  | Detailed analytics           |
| GET    | `/alerts`                   | Yes  | List alerts                  |
| PATCH  | `/alerts/read-all`          | Yes  | Mark all alerts read         |
| PATCH  | `/alerts/:id`               | Yes  | Update alert status          |
| GET    | `/insights`                 | Yes  | List active insights         |
| PATCH  | `/insights/:id/dismiss`     | Yes  | Dismiss insight              |
| GET    | `/search?q=`                | Yes  | Search transactions (ES)     |
| POST   | `/upload/receipt`           | Yes  | Upload receipt file          |
| DELETE | `/upload/receipt`           | Yes  | Delete receipt file          |
| GET    | `/admin/users`              | Admin| List all users               |
| GET    | `/admin/stats`              | Admin| Platform statistics          |

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Fill in Supabase, ElasticSearch, SMTP credentials
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Server starts at `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Tech Stack

- **Next.js 14 Route Handlers** — API runtime
- **TypeScript 5.6** — Type safety
- **Supabase** — Database, Auth, Storage
- **ElasticSearch 8.15** — Full-text search
- **Winston** — Structured logging
- **Zod** — Input validation
- **Nodemailer** — Email notifications
