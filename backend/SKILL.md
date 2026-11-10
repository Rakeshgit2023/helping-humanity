---
name: helping-humanity-backend
description: Conventions and architecture for the Help In Humanity Express/TypeScript/Drizzle backend. Use this skill whenever adding, editing, or reviewing code in this repo — new API modules (routes/controllers/services/DTOs), database schema changes, auth/JWT logic, email templates, or error handling. Make sure to follow these exact patterns rather than inventing new ones, since the codebase is deliberately uniform across modules.
---

# Help In Humanity Backend — Codebase Skill

This skill captures the architecture and conventions of the `helping-humanity` backend so that new code matches the existing style exactly. The stack is **Express 5 + TypeScript (ESM) + Drizzle ORM + PostgreSQL + Zod**, structured as a modular monolith under `src/app/module/`.

Read this before writing any new route, service, DTO, or schema change in this repo.

## Module anatomy (always follow this exact 4-file pattern)

Every feature lives in `src/app/module/<name>/` with these files:

```
module/<name>/
├── route.ts          # Router: wires validate(dto) + catchAsyncErrors(controller.fn)
├── controller.ts      # thin: destructure req, call service, return ApiResponse
├── service.ts          # business logic, wrapped in withErrorHandling("Label", fn)
└── dto/
    └── <action>.dto.ts  # one zod schema per endpoint payload, exported as a class instance
```

When asked to add a new endpoint or module, create/extend files in this exact shape — don't collapse layers or put DB queries in the controller.

### route.ts

```ts
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import { catchAsyncErrors } from "../../comman/middleware/catchAsyncError.js";
import myActionDto from "./dto/myAction.dto.js";

const router: Router = Router();
router.post(
  "/myAction",
  validate(myActionDto),
  catchAsyncErrors(controller.myAction),
);
export default router;
```

Then mount it in `src/app/index.ts` with `app.use("/<prefix>", myRouter);`.

### controller.ts

```ts
export const myAction = async (req: Request, res: Response) => {
  const result = await myService.myAction(req.body);
  return ApiResponse.ok(res, "Did the thing", result);
};
```

Controllers never touch the database directly and never construct error responses manually — throw `ApiError` from the service layer instead.

### service.ts

Every exported function is wrapped in `withErrorHandling("Human Readable Label", async (...) => { ... })`. This:

- lets `ApiError`s (400/401/403/404/409) pass through untouched,
- logs and converts any _unexpected_ error into a generic `ApiError.internal(...)`.

Use `ApiError.badRequest / unauthorized / forbidden / notFound / conflict / internal(message)` for all expected failure cases — never throw a raw `Error` or return an error object.

### dto/\*.dto.ts

Each DTO is a Zod object schema wrapped by extending `BaseDto`, and exported as a singleton instance (not the class):

```ts
const myActionSchema = z.object({ ... });
export type MyActionInput = z.infer<typeof myActionSchema>;
class MyActionDto extends BaseDto<typeof myActionSchema.shape> {
  constructor() { super(myActionSchema); }
}
export default new MyActionDto();
```

`validate.middleware.ts` calls `.validate()` on this instance and replaces `req.body` with the parsed/typed value — so controllers can trust `req.body`'s shape matches the inferred type.

## Response & error conventions

- **Success**: always via `ApiResponse.ok(res, message, data)` / `.created(...)` / `.noContent(res)` — never call `res.json()` directly in a controller.
- **Errors**: always throw `ApiError.<method>(message)` from the service; the global `errorHandler` middleware (mounted last in `src/app/index.ts`) converts it to `{ success: false, message }` with the right status code. It also auto-handles Postgres unique-constraint (`23505` → 409) and FK-violation (`23503` → 400) errors, so don't special-case those yourself.
- Async route handlers must be wrapped in `catchAsyncErrors(...)` in `route.ts` — there is no other try/catch around controllers.

## Database (Drizzle) conventions

- All tables live in `src/db/schema.ts`, using `pgTable` with a `uuid` primary key (`defaultRandom()`), `createdAt`/`updatedAt` timestamps (`updatedAt` uses `$onUpdate(() => new Date())`), and explicit `uniqueIndex`/`index` calls in the trailing array-callback form (`(t) => [...]`), not the older object form.
- Enums are `pgEnum` values sourced from shared arrays in `src/app/comman/utils/constant.ts` (e.g. `roleValues`, `genderValues`, `booldGroupValues`) — add new enum values there, not inline in the schema.
- Multi-step writes (e.g. create user + create profile + create OTP) go inside `db.transaction(async (tx) => { ... })`, using `tx` instead of `db` for every query in that block.
- After changing `schema.ts`, run `pnpm db:generate` to create a migration, then `pnpm db:migrate` to apply it (or `pnpm db:push` for local-only iteration).

## Auth & security conventions

- Passwords: hashed with `bcrypt.hash(password, 12)`; compared with `bcrypt.compare`.
- OTPs and refresh tokens are never stored raw — always hashed with `hashToken()` (SHA-256, from `jwt.ts`) before insertion, and compared by hashing the incoming value the same way.
- Access/refresh tokens are signed with separate secrets/expiries from `env.ts` via `generateAccessToken` / `generateRefreshToken` — payload shape is the `User` interface in `jwt.ts` (id, firstName, lastName, email, role). Don't put sensitive fields (password hash, etc.) in the JWT payload.
- New required config always goes through `src/env.ts`'s Zod schema first — never read `process.env.X` directly elsewhere in the app.

## Email conventions

- All outbound email goes through `src/app/comman/utils/email.ts`. New transactional emails should reuse `renderEmailShell(...)` for the header/footer/branding and add a new `sendXxxEmail` export at the bottom, following `sendVerificationEmail` / `sendResetPasswordEmail` as templates.
- Keep styles inline (table-based layout) — this is intentional for Gmail/Outlook compatibility, not a shortcut to clean up.

## Things to double check before finishing a change

1. Did you add the DTO, and does `route.ts` call `validate(dto)` before the controller?
2. Does the service throw `ApiError.*` for every expected failure path (not-found, conflict, forbidden, etc.)?
3. Is the service function wrapped in `withErrorHandling("Label", ...)`?
4. If you touched `schema.ts`, did you generate + mention running a migration?
5. Did you mount any new router in `src/app/index.ts`?
6. Naming: the shared folder is `comman/` (intentional typo, already in wide use) — match it, don't rename to `common/`.
