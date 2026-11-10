# Help In Humanity — Backend

Backend API for **Help In Humanity**, an NGO / volunteer coordination platform ("Join Hands And Be A Hero"). Handles user registration, authentication, email verification (OTP), and volunteer interest/category management.

## Tech Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Runtime        | Node.js (ESM, `type: module`)       |
| Language       | TypeScript                          |
| Web framework  | Express 5                           |
| ORM            | Drizzle ORM (`drizzle-orm`)         |
| Database       | PostgreSQL 17 (via Docker Compose)  |
| Validation     | Zod                                 |
| Auth           | JWT (`jsonwebtoken`) + bcryptjs     |
| Email          | Nodemailer (SMTP)                   |
| Package manager| pnpm                                |

## Project Structure

```
backend/
├── src/
│   ├── index.ts                 # entry point — starts the HTTP server
│   ├── env.ts                   # zod-validated environment variables
│   ├── app/
│   │   ├── index.ts             # Express app factory (middleware + routes)
│   │   ├── comman/               # shared/common code (note: "comman", not "common")
│   │   │   ├── dto/base.dto.ts   # base class all DTOs extend (zod validation wrapper)
│   │   │   ├── middleware/       # validate, catchAsyncErrors, error handler, withErrorHandling
│   │   │   └── utils/            # ApiError, ApiResponse, JWT helpers, email templates, constants
│   │   └── module/
│   │       └── auth/             # feature module: route → controller → service → dto
│   └── db/
│       ├── index.ts              # Drizzle + pg Pool connection
│       └── schema.ts             # table definitions (users, sessions, OTPs, volunteers, etc.)
├── drizzle/                      # generated SQL migrations + snapshots
├── drizzle.config.js             # drizzle-kit config
├── docker-compose.yml            # local Postgres container
└── package.json
```

Each **feature module** (e.g. `auth`) follows the same layout:
```
module/<name>/
├── route.ts        # Express Router — wires validation + controller
├── controller.ts    # thin HTTP layer — calls service, returns ApiResponse
├── service.ts        # business logic + DB queries (wrapped in withErrorHandling)
└── dto/*.dto.ts       # zod schemas + validation, one file per request shape
```

## Getting Started

### 1. Prerequisites
- Node.js
- pnpm (`^11.17.0`)
- Docker (for local Postgres) — or your own Postgres instance

### 2. Install dependencies
```bash
pnpm install
```

### 3. Configure environment variables
Create a `.env` file in the project root with:

```env
PORT=4000

DATABASE_URL=postgres://postgres:postgres@localhost:5432/helpin_humanity

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM_NAME=Help In Humanity

CLIENT_URL=http://localhost:3000
```
All of these are required and validated at startup via `src/env.ts` (Zod) — the app will throw immediately if any are missing.

### 4. Start Postgres
```bash
pnpm db:up        # docker compose up -d
```

### 5. Run database migrations
```bash
pnpm db:generate   # generate a migration from schema.ts changes
pnpm db:migrate     # apply migrations to the database
# or, for quick local iteration without a migration file:
pnpm db:push
```

### 6. Run the app
```bash
pnpm dev            # watch mode (tsc-watch + node dist/index.js)
# or
pnpm build && pnpm start
```

Server starts on `http://localhost:$PORT` (default `4000`). Health check: `GET /health`.

## Available Scripts

| Script            | Purpose                                      |
|-------------------|-----------------------------------------------|
| `pnpm dev`        | Build on change + auto-restart server          |
| `pnpm build`      | Compile TypeScript to `dist/`                   |
| `pnpm start`       | Run compiled server from `dist/index.js`        |
| `pnpm studio`      | Open Drizzle Studio (visual DB browser)         |
| `pnpm db:generate` | Generate a new SQL migration from schema.ts     |
| `pnpm db:migrate`  | Apply pending migrations                        |
| `pnpm db:push`     | Push schema directly to DB (no migration file)  |
| `pnpm db:up`       | Start the local Postgres container              |
| `pnpm db:down`     | Stop the local Postgres container                |

## API Endpoints

All routes are currently mounted under `/auth`.

| Method | Endpoint                          | Description                                          |
|--------|------------------------------------|--------------------------------------------------------|
| POST   | `/auth/register`                   | Register a new user (optionally as a `volunteer` with interests + blood group) |
| POST   | `/auth/signIn`                     | Sign in with email + password → returns access & refresh JWTs, creates a session |
| POST   | `/auth/sendOtpForEmailVerification`| Send/resend a 6-digit OTP to the user's email (60s cooldown) |
| POST   | `/auth/verifyEmailWithOtp`         | Verify email using the OTP sent above                   |
| GET    | `/health`                          | Health check (`{ status: "ok", healthy: true }`)         |

### Response shape
```json
// success
{ "message": "...", "data": { ... } }

// error (thrown as ApiError, caught by errorHandler)
{ "success": false, "message": "..." }
```

## Database Schema (overview)

- **users** — core account record (name, email, phone, password hash, role: `user | volunteer | admin`, gender, banned/verified flags)
- **email_verification_otps** — hashed OTPs tied to a user, with expiry
- **sessions** — hashed refresh tokens per login, with user agent + expiry
- **volunteer_profiles** — 1:1 extension of `users` for volunteers (bio, availability, blood group, last known location, rating, avg response time)
- **category** — pool of volunteering interest categories (e.g. blood donation, disaster relief)
- **volunteer_interests** — many-to-many link between volunteers and categories

## Notes / Known Quirks

- The folder is named `comman/` (typo for "common") — kept as-is for consistency with existing imports; don't "fix" it without a project-wide rename.
- `dist/` in the uploaded zip includes a compiled `module/interest` (controller/service/route/dto) that **does not exist in `src/`** — it looks like an in-progress module that was removed from source but not yet rebuilt. If you're continuing that work, you'll need to recreate `src/app/module/interest/` from scratch (the `category` table already exists in the schema to support it).
- Email templates (OTP / verification / reset-password) are fully inlined HTML in `src/app/comman/utils/email.ts` for email-client compatibility (table-based layout, inline styles, CID-embedded logo).
