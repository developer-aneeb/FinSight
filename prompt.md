You are an expert full-stack developer with deep experience building scalable web apps using:
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Search**: ElasticSearch for catalog/filtering
- **Utilities**: winston (logging), centralized error handling, nodemailer, CORS, rate limiting, helmet, multer
- **UX/UI**: Accessibility focus, reusable Tailwind CSS components

Generate the full project with the following requirements:

## STACK, CONFIG & ARCHITECTURE
1. Provide a modular folder structure that includes:
   - `/app`, `/components`, `/hooks`, `/services`, `/utils`, `/middleware`, `/api`
   - `/supabase` for schema SQL and migrations
2. Include a comprehensive **architecture description** with diagrams/ASCII planning:
   - Frontend, backend routes, services, database, and search layer relationships
   - Explain each folder’s purpose
3. Provide a **clear README** with:
   - Setup instructions
   - Environment variables
   - Deployment steps (Vercel + Supabase + ElasticSearch)
   - How to test locally
4. Define exact **package.json dependencies** and versions.

## SUPABASE
1. Provide the full **SQL schema** for:
   - users, transactions, categories, budgets, insights, ElasticSearch indexing table
   - Role Based Access Control (RLS policies)
2. Provide sample SQL inserts for mock data.
3. Create Supabase edge functions for secure backend logic.

## BACKEND API ROUTES (Next.js API)
Implement all REST endpoints with:
- Input validation
- Centralized error handling
- Logging with `winston`
- Email sending via `nodemailer`

Routes to include:

## UTILITIES
1. **Logging**: winston logger integrated into every API and backend module.
2. **Security**: helmet, CORS configuration, rate limiting.
3. **Validation**: Use `validator` lib to validate user inputs.
4. **File Uploads**: `multer` middleware with Supabase Storage upload example.

## FRONTEND UI COMPONENTS (Tailwind)
Generate reusable, accessible Tailwind CSS components with JSX:
- Product Grid
- Filter Sidebar
- Product Card
- Cart Sidebar
- Checkout Stepper
- Reviews List
- Admin Form

Include:
- Accessibility attributes (ARIA)
- Loading and error states
- Responsive design
- State management (use React Query or Zustand)

## PAGES & FUNCTIONAL BEHAVIOR
1. Home / Dashboard
2. Catalog & Product Listing (with ElasticSearch filters)
3. Product Details
4. Cart & Checkout
5. Orders (history)
6. User Profile & Settings
7. Admin Panel (CRUD)

## STATE MANAGEMENT
Implement a unified client-side state system using React Query or Zustand:
- Authentication state
- Transactions cache
- Search filters
- Cart state

## SECURITY & BEST PRACTICES
- CORS config
- Rate limiter policies
- Token refresh logic
- Sensitive data protection
- Escaping and sanitizing all input

## DELIVERABLES
- Project folder archive structure
- Full SQL schema + migrations
- Next.js API routes
- Tailwind UI components
- Services & utilities
- README with setup, env vars
- Documentation blocks + doc comments

Make sure all output is ready to paste into production files with correct imports and TypeScript types.


