# FinSight — AI-Powered Personal Finance Manager 🇵🇰

A full-stack personal finance management application built for the Pakistani market, featuring transaction tracking, smart budgets, visual analytics, and AI-driven insights — all in PKR.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Express 4.21 + TypeScript 5.6 |
| **Frontend** | Next.js 14 (App Router) + TypeScript 5.6 |
| **Styling** | Tailwind CSS 3.4 |
| **Database** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **State** | Zustand (client) + React Query 5 (server) |
| **Charts** | Recharts 2.12 |
| **Search** | ElasticSearch 8.15 |
| **Logging** | Winston 3.14 |
| **Validation** | Zod 3.23 + validator |
| **Email** | Nodemailer 6.9 |
| **Icons** | lucide-react |

## Project Structure

```
FinSight/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/             # Env, Supabase, ElasticSearch, Email config
│   │   ├── controllers/        # 10 request handler controllers
│   │   ├── helpers/            # Response, pagination, date helpers
│   │   ├── middleware/         # Auth, CORS, error handler, rate limit, validation
│   │   ├── routes/             # 10 Express route modules
│   │   ├── services/           # 10 business logic services
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Logger, validation, constants, currency
│   │   ├── app.ts              # Express app setup
│   │   ├── routes.ts           # Central route aggregator (/api/v1)
│   │   └── server.ts           # Server entry point (port 5000)
│   ├── supabase/               # Database schema, migrations, seed, edge functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js client application
│   ├── src/
│   │   ├── app/                # Pages (auth, dashboard, transactions, etc.)
│   │   ├── components/         # UI components (7 categories)
│   │   ├── hooks/              # React Query hooks + apiClient
│   │   ├── store/              # Zustand stores (auth, transactions, budgets, filters)
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Formatters, validators, helpers
│   ├── middleware.ts            # Next.js root middleware (auth redirects)
│   ├── package.json
│   └── tsconfig.json
├── doc/                        # Project documentation
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Supabase** account with a project created
- **ElasticSearch** 8.x instance (optional — search degrades gracefully)
- **SMTP** credentials for email alerts (optional)

### 1. Clone & Install

```bash
cd FinSight

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** — copy and configure:
```bash
cd backend
cp .env.example .env
```

Key backend variables:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `ELASTICSEARCH_URL` | ElasticSearch endpoint |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email provider config |

**Frontend** — copy and configure:
```bash
cd frontend
cp .env.example .env.local
```

Key frontend variable:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:5000/api/v1`) |

### 3. Database Setup

Run the schema against your Supabase project:

1. Open the **Supabase SQL Editor**
2. Paste and execute `backend/supabase/schema.sql`
3. Then run `backend/supabase/seed.sql` to insert default categories

Or using the Supabase CLI:

```bash
cd backend
supabase db push
supabase db seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Backend API: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
Frontend:    [http://localhost:3000](http://localhost:3000)

## Features

### Module 1 — Authentication & User Management
- Email/password signup and login via Supabase Auth
- Profile management with role-based access (user / admin)
- Protected routes with middleware-based redirects
- JWT-based API authentication with Row-Level Security

### Module 2 — Transaction Management
- Full CRUD for income and expense transactions
- Category and tag assignment
- Receipt image upload to Supabase Storage
- Advanced filtering (type, category, date range, amount range)
- Pagination and sorting
- Full-text search via ElasticSearch

### Module 3 — Budget Management
- Create budgets per category with weekly/monthly/yearly periods
- Real-time progress tracking with visual progress bars
- Automatic spent amount recalculation via DB triggers
- Alert thresholds at 50%, 75%, 90%, and 100%

### Module 4 — Analytics & Reporting
- Dashboard summary: income, expenses, net balance, active budgets
- 6-month spending trend (bar chart)
- Category breakdown (donut chart)
- Daily spending analysis
- Savings rate calculation
- Detailed table with percentage of total

### Module 5 — Alerts
- Budget overrun alerts with severity levels
- Unread/read/dismissed status management
- Email notifications for budget alerts and weekly summaries
- In-app notification badges

### Module 6 — AI Insights (Edge Function)
- Supabase Edge Function that compares month-over-month spending
- Generates insights for categories with >20% spending changes
- Dismissible insight cards

## API Routes

All endpoints are prefixed with `/api/v1` on the backend (port 5000).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/signup` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive session |
| POST | `/auth/logout` | Yes | End session |
| POST | `/auth/reset-password` | No | Request password reset |
| GET | `/auth/profile` | Yes | Get user profile |
| PUT | `/auth/profile` | Yes | Update profile |
| GET | `/transactions` | Yes | List transactions (filtered, paginated) |
| POST | `/transactions` | Yes | Create transaction |
| GET | `/transactions/:id` | Yes | Get single transaction |
| PUT | `/transactions/:id` | Yes | Update transaction |
| DELETE | `/transactions/:id` | Yes | Delete transaction |
| GET | `/transactions/summary/monthly` | Yes | Monthly summary |
| GET | `/categories` | Yes | List categories |
| POST | `/categories` | Yes | Create category |
| PUT | `/categories/:id` | Yes | Update category |
| DELETE | `/categories/:id` | Yes | Delete category |
| GET | `/categories/tags` | Yes | List tags |
| POST | `/categories/tags` | Yes | Create tag |
| DELETE | `/categories/tags/:id` | Yes | Delete tag |
| GET | `/budgets` | Yes | List budgets |
| GET | `/budgets/active` | Yes | Active budgets with usage |
| POST | `/budgets` | Yes | Create budget |
| GET | `/budgets/:id` | Yes | Get budget |
| PUT | `/budgets/:id` | Yes | Update budget |
| DELETE | `/budgets/:id` | Yes | Delete budget |
| GET | `/analytics/dashboard` | Yes | Dashboard summary |
| GET | `/analytics/detailed` | Yes | Detailed analytics |
| GET | `/insights` | Yes | AI-generated insights |
| PATCH | `/insights/:id/dismiss` | Yes | Dismiss an insight |
| GET | `/alerts` | Yes | List alerts |
| PATCH | `/alerts/:id` | Yes | Update alert status |
| PATCH | `/alerts/read-all` | Yes | Mark all alerts read |
| GET | `/search?q=` | Yes | Full-text transaction search |
| POST | `/upload/receipt` | Yes | Upload receipt image |
| DELETE | `/upload/receipt` | Yes | Delete receipt |
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/stats` | Admin | Platform statistics |

## Security

- **Row-Level Security (RLS)** on all tables — users can only access their own data
- **Rate limiting** on all API routes (configurable via env)
- **Input validation** with Zod schemas and sanitization
- **CORS** middleware with configurable allowed origins
- **Security headers** (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- **JWT verification** on all protected endpoints

## Deployment

### Backend

1. Build: `cd backend && npm run build`
2. Start: `npm start` (runs `node dist/server.js`)
3. Deploy to any Node.js host (Railway, Render, AWS, etc.)
4. Set environment variables on host

### Frontend (Vercel Recommended)

1. Push to GitHub
2. Import `frontend/` into [Vercel](https://vercel.com)
3. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
4. Deploy

### Supabase

- Database and Auth are hosted on Supabase
- Deploy Edge Functions: `supabase functions deploy aggregate-insights`
- Enable Storage bucket `receipts` with appropriate policies

### ElasticSearch

- Use [Elastic Cloud](https://cloud.elastic.co) or self-host
- The app creates its index automatically on first query
- Search is optional — the app works without it

## Scripts

```bash
# Backend (from backend/ directory)
npm run dev       # Development server with hot reload
npm run build     # Compile TypeScript to dist/
npm start         # Production server
npm run lint      # ESLint check

# Frontend (from frontend/ directory)
npm run dev       # Next.js dev server
npm run build     # Production build
npm start         # Production server
npm run lint      # ESLint check
```

## License

MIT
