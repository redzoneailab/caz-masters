# The Caz Masters

Annual charity golf tournament website at **cazmasters.com**. Built with the long-term vision of becoming a "tournament in a box" white-label product for any golf tournament organizer.

All proceeds benefit **Caz Cares**, a local charity supporting youth athletics, community programs, and families in need in Cazenovia, NY.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Prisma 7 with `@prisma/adapter-pg` (PostgreSQL via Supabase)
- **Payments**: Stripe (checkout sessions, webhooks, payment links)
- **Email**: Resend
- **Auth**: NextAuth v4 (Google OAuth + magic link)
- **Hosting**: Vercel (auto-deploys from `main` branch)
- **Repo**: github.com/redzoneailab/caz-masters
- **Domain**: cazmasters.com (Squarespace nameservers pointed to Vercel)

## Database

Supabase PostgreSQL. Prisma client generated to `src/generated/prisma`, imported from `@/generated/prisma/client`. Prisma config lives in `prisma.config.ts` (uses `DIRECT_URL` for migrations).

### Key Models

| Model | Purpose |
|---|---|
| `Tournament` | Year, settings, finalized flag. Everything scoped by tournament_id for future multi-tenancy |
| `PlayerProfile` | Permanent identity across years (linked to UserAccount) |
| `UserAccount` | Auth identity (Google/magic link) |
| `Player` | Per-tournament registration (name, flight, email, payment status) |
| `Team` | 4-5 players, starting hole for shotgun start |
| `Score` | Per-hole scores with shotgun beer tracking |
| `Payment` | Stripe payment records |
| `Product` / `ProductVariant` | Merch store items with size/variant inventory |
| `StoreOrder` / `OrderItem` | Store purchases with shipping address |
| `AfterPartyRegistration` | After party signups (online or at-door payment) |
| `Donation` | Caz Cares donations via Stripe |
| `Course` / `CourseHole` / `CourseTeeBox` | Course data with per-hole tee boxes and par |
| `HallOfFameEntry` | Past champions with category, score, description |
| `GalleryAlbum` / `GalleryPhoto` | Photo galleries (photos hosted on Google Drive) |

## Site Structure

### Public Pages

- `/` — Home (hero, countdown, spots counter, photo strips, CTA)
- `/about` — "The Story" (origin, Caz Cares mission, Hall of Fame photos)
- `/info` — Tournament details (Stableford format, rules, course, flights, prizes)
- `/register` — Registration form with after party upsell, Stripe checkout
- `/register/confirmation` — Post-registration confirmation
- `/teams` — Team board
- `/scoring` — Mobile-first score entry with offline support, shotgun start
- `/leaderboard` — Live leaderboard with PGA-style sort, 30s auto-refresh
- `/store` — Merch store (all proceeds to Caz Cares)
- `/afterparty` — After party registration (pay online or at door)
- `/donate` — Caz Cares donation page
- `/history` — Hall of Fame (manual entries + auto-generated from finalized scores)
- `/gallery` — Photo gallery with lightbox (Google Drive links)
- `/stats` — All-time records (lowest rounds, most wins, career shotguns, etc.)
- `/players` — Public player directory
- `/player/[id]` — Player profile with career stats and expandable scorecards
- `/auth/signin` — Google + magic link sign-in

### Admin

`/admin` — Protected by `ADMIN_PASSWORD` bearer token auth. Link intentionally hidden from public footer; navigate directly.

**Tabs**: Players, Teams, Course & PINs, Live Scores, Hall of Fame, Gallery, Donations, Store, After Party

### Navbar

Home, About, Tournament, Store, Caz Cares | Live dropdown (Scoring, Leaderboard) | Record Book dropdown (Stats, Players, Hall of Fame, Gallery) | Register CTA

## Key Architecture Decisions

### Player Identity
- `PlayerProfile` is permanent identity across tournament years
- `Player` is a per-tournament registration record
- Registration form auto-detects returning players by email and pre-fills info

### Scoring
- **Stableford scoring**: Albatross+=5, Eagle=4, Birdie=3, Par=2, Bogey=1, Double+=0
- **Teams of 4**: all scores count per hole
- **Teams of 5**: drop the median score per hole
- **Shotgun Mulligan**: combined shotgun beer + rehit into a single toggle per hole
- Single universal scorer PIN per tournament (set in admin)
- Scorer locking prevents concurrent edits to the same team

### Course & Tee Boxes
- Course data imported from golfcourseapi.com API with admin override capability
- Tee assignments configurable by flight (Men/Women) with per-hole overrides
- `src/lib/tees.ts` — `getTeeBoxName()`, `isMensFlight()`, `isWomensFlight()`
- Per-player par calculation based on their flight's tee assignment

### Shotgun Start
- `Team.startingHole` determines where each team begins
- Scoring wraps around (e.g., start on hole 5, play 5-9, then 1-4 mapped to 10-18)
- Admin assigns starting holes via team dropdown

### Registration & Payments
- **Free registration mode**: payment deferred, toggled in admin
- **Paid mode**: Stripe checkout with configurable entry fee
- Entry fee is dynamic from the database (`TournamentSettings`), never hardcoded
- After party upsell bundled into single Stripe checkout session
- Beer tab settlement via email with Stripe payment links
- Webhook handles `storeOrderId` + `afterPartyId` metadata, decrements stock on payment

### Data & Exports
- CSV exports available for team sheet, final results, and beer tabs
- `Tournament.finalized` flag enables auto-populating Hall of Fame from scores
- Hall of Fame supports both manual entries and auto-generated entries from finalized tournaments

## Cazenovia Golf Club Specifics

9-hole course played as 18 holes:
- **Men**: White tees (front 9, holes 1-9), Red tees (back 9, holes 10-18)
- **Women**: Yellow tees (all 18 holes)
- Course imported from golfcourseapi.com with compound tee name splitting (e.g., "White/Red" splits to White for holes 1-9, Red for holes 10-18)

## Design

- **Colors**: Navy blue (`#0F2244` range / `navy-*`) + Gold (`#C5A55A` range / `gold-*`)
- **Tone**: Premium but fun. Not corporate. Casual copy with personality.
- **Layout**: Mobile-first responsive design
- **Fonts**: Geist Sans + Geist Mono

## Key File Paths

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema (all models) |
| `prisma.config.ts` | Prisma config with adapter-pg setup |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | NextAuth config (Google, JWT) |
| `src/lib/tournament.ts` | Tournament constants (edition, dates, pricing) |
| `src/lib/tournament-settings.ts` | Dynamic settings from DB (free registration, entry fee) |
| `src/lib/tees.ts` | Tee box assignment logic by flight |
| `src/app/admin/AdminDashboard.tsx` | Admin dashboard with all tabs |
| `src/app/scoring/ScoringInterface.tsx` | Mobile score entry with offline support |
| `src/app/leaderboard/LeaderboardView.tsx` | Live leaderboard with 30s refresh |

## Environment Variables

```
DATABASE_URL=             # Supabase pooled connection string
DIRECT_URL=               # Supabase direct connection (for prisma db push)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
ADMIN_PASSWORD=           # Bearer token for /admin and admin API routes
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
GOLF_COURSE_API_KEY=      # golfcourseapi.com API key
```

## Development Workflow

```bash
npm run dev               # Start dev server
npx next build            # Build (ALWAYS run before pushing — Vercel rejects TS errors)
npx prisma db push        # Push schema changes to Supabase (not migrate dev — shadow DB issues)
npx prisma generate       # Regenerate Prisma client after schema changes
npx prisma studio         # Browse database
```

### Important Patterns

- **Always run `npx next build` before pushing** — Vercel will reject TypeScript errors
- **Schema changes**: edit `prisma/schema.prisma`, then `npx prisma db push`, then `npx prisma generate`
- Use `prisma db push` (not `migrate dev`) due to shadow database issues with prior migrations
- Registration form stores `genderFlight` as `"Men"` / `"Women"` (not `"Men's"` / `"Women's"`)
- Generated Prisma client lives at `src/generated/prisma`, import from `@/generated/prisma/client`
- OG meta tags configured in root layout with `title.template: "%s | The Caz Masters"` — sub-pages only set the prefix (e.g., `title: "Register"`)

## Tournament in a Box Vision

The long-term goal is a white-label SaaS product for any golf tournament. Everything is already scoped by `tournament_id` for future multi-tenancy.

### Future Work
- Multi-tenant auth (organizer accounts)
- Stripe Connect per organizer
- White-label branding and theming (custom colors, logos, fonts)
- Onboarding wizard for new tournaments
- GHIN handicap API integration
- Configurable scoring formats beyond Stableford (stroke play, match play, scramble)
- Course database with search/autocomplete
- Recurring tournament support (clone settings year to year)
