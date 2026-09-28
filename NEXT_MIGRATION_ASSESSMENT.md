# Next.js Security Migration Assessment

Written for: whoever owns deployment of this app — read before deciding when/whether to upgrade Next.js.

## 1. Current state

- Installed: **Next.js 14.2.35** (confirmed via `npm ls next`)
- `npm audit`: 1 critical, 1 high vulnerability, both rooted in the Next.js package itself (the high one is a transitive `postcss` dependency bundled *inside* `next`'s own `node_modules`, not something this project can patch independently).

## 2. The advisory

**GHSA-p293-qw3h-jr36** — "Next.js: Unauthenticated Remote Code Execution on Windows-hosted servers." Severity: **Critical**.

Verified live against the GitHub Advisory Database on 2026-09-28:

| Vulnerable range | Fixed at |
|---|---|
| `>=13.4.0 <15.5.24` | `15.5.24` |
| `>=16.0.0 <16.3.3` | `16.3.3` |

**Is 14.2.35 still affected? Yes.** There is **no 14.x patched release** — the fix only exists in 15.5.24+ or 16.3.3+. Staying on the 14.x line, at any patch level, does not resolve this.

The RCE specifically applies to **Windows-hosted servers**, which is the platform this app has been developed and (per the current setup) may be deployed on — this is not a theoretical/low-relevance advisory for this project.

## 3. Recommended target

**Next.js 15.5.24 or later**, not 16.x, for this migration. Reasoning:
- It's the smaller jump (14 → 15 vs. 14 → 16) and the minimum needed to close the RCE.
- Next 16 adds its own additional breaking changes and a stronger pull toward React 19 (several of this project's other dependencies — `react-leaflet` 4.x, `next-auth` 4.x — are pinned to React 18 peer ranges), which would compound the migration risk.
- A future 15 → 16 upgrade can be evaluated separately, later, once the codebase is already async-params-compatible.

## 4. Required dependency changes

| Package | Current | Needed for Next 15 |
|---|---|---|
| `react` / `react-dom` | 18.3.1 | 18.2+ is fine — **no forced major bump** for Next 15 specifically |
| `next-auth` | ^4.24.8 | **Unverified compatibility.** v4 was built around the Next 13/14 App Router shape; official guidance increasingly points to `next-auth` v5 (Auth.js) for Next 15. This needs hands-on testing, not just a version bump — it's the single biggest unknown in this migration. |
| `eslint-config-next` | not installed | n/a |
| `tailwindcss`, `mongoose`, `bcryptjs`, `leaflet`, `react-leaflet` | current | unaffected by this migration |

## 5. Breaking change: async `params` / `searchParams`

In Next 15, `params` (route handlers *and* pages) and the `searchParams` page prop become `Promise`s that must be `await`ed instead of read synchronously. Grepped this codebase directly rather than estimating — **exact affected files**:

**`params` (route handler 2nd arg, or page prop) — 7 files:**
- `app/api/admin/spots/[id]/route.js`
- `app/api/admin/users/[id]/route.js`
- `app/api/bookings/[id]/route.js`
- `app/api/favorites/[spotId]/route.js`
- `app/api/notifications/[id]/route.js`
- `app/api/spots/[id]/route.js`
- `app/spots/[id]/page.js` (both `generateMetadata({ params })` and the page component itself, plus the cached `getSpotData(id)` helper that both call into)

**`searchParams` (page prop) — 1 file:**
- `app/page.js` (reads `searchParams.city`, `.vehicleType`, `.maxPrice`, `.lat`, `.lng` synchronously, both server-side in `getSpots()` and client-facing as `<input defaultValue={searchParams.city}>` etc.)

Note: the other files the grep found using the word "searchParams" (`app/api/spots/route.js`, `app/api/spots/nearby/route.js`, and the rest of the admin/booking/favorites/notifications API routes) use `new URL(req.url).searchParams` — that's the standard Web `URL` API applied to the request object, **not** the Next.js page-level `searchParams` prop, and is **unaffected** by this change.

**Middleware** (`middleware.js`): doesn't use `params`/`searchParams` directly, but wraps `next-auth/middleware`'s `withAuth` — its behavior under Next 15 is exactly the part covered by the `next-auth` compatibility question in §4, not something to verify in isolation.

## 6. Effort/risk estimate

- **Mechanical part** (await params/searchParams in the 8 files above): low risk, a few hours, easy to test — every affected route already has this session's test coverage (curl-based E2E checks) to re-run afterward.
- **Real risk**: `next-auth` v4 behavior on Next 15, particularly the `withAuth` middleware that gates `/admin`, `/dashboard`, `/spots/new`, `/spots/:id/edit`, `/saved`, `/notifications`. If this breaks, it breaks *auth-gating on every protected route* — high blast radius, needs to be the first thing tested after upgrading, not the last.
- No test suite exists in this project beyond this session's manual/curl checks, so there's no automated regression safety net for a migration this size.

## 7. Decision

**Migration not performed.** Per explicit instruction this pass, and because the `next-auth` compatibility question is a real unknown rather than a known-safe mechanical change, this doesn't qualify as "low-risk and can be completed safely" without hands-on testing first.

**The RCE remains unresolved on this codebase as of this document.**

## 8. Suggested migration steps (when actually undertaken)

1. Create a branch / safe checkpoint.
2. `npm install next@15.5.24` (pin the exact version, don't float to `^15`).
3. Run `npm run build` — Next 15's codemod (`npx @next/codemod@latest next-async-request-api .`) can auto-convert most of the 8 `params`/`searchParams` sites.
4. Manually verify `app/page.js` and `app/spots/[id]/page.js` after the codemod — they have non-trivial logic built around those props (geo query branching, cached `getSpotData`), not just simple pass-through.
5. Test `next-auth` + middleware first, in isolation: log in as a normal user, confirm `/admin` still redirects; log in as admin, confirm `/admin` loads; log out, confirm `/dashboard` redirects to login. If any of these regress, stop and evaluate `next-auth` v5 before going further.
6. Re-run the full booking lifecycle (register → list → approve → book → confirm → pay → complete → review) and the IDOR checks from this session's QA before considering it done.
7. Rollback plan: revert the branch / redeploy the previous build — no database schema changes are involved in this migration, so rollback is purely a code revert.
