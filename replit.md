# Recipease - Recipe Management App

## Overview
A mobile-first recipe management web app with a premium, minimal design. Features three main sections: Discover (Tinder-style swipe cards), All Recipes (searchable list), and Recent (grid feed). Uses a bottom tab bar for navigation and drawer-based recipe detail views. Includes user accounts with username/password auth, a follow system, and recipe filtering by ownership.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Framer Motion, Vaul (drawer), Shadcn UI
- **Backend**: Express.js with Passport.js (local strategy) + express-session
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Username/password with bcryptjs hashing, session-based

## Project Structure
- `client/src/App.tsx` - Main app with tab navigation and AuthProvider
- `client/src/pages/` - Discover, All Recipes, Recent pages (each with filter toggles)
- `client/src/components/` - Shared components (bottom tab bar, recipe detail sheet, add recipe form, auth sheet, following/people sheet, placeholder images)
- `client/src/hooks/use-auth.tsx` - Auth context/provider with login/signup/logout
- `server/routes.ts` - API endpoints (recipes, auth, follow)
- `server/auth.ts` - Passport.js setup, session config, requireAuth middleware
- `server/storage.ts` - Database storage layer with auth, follow, and filtered recipe methods
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data (3 example recipes)
- `shared/schema.ts` - Drizzle schema definitions (users, recipes, follows)

## API Routes
### Auth
- `POST /api/auth/signup` - Create account (username, password, displayName?)
- `POST /api/auth/login` - Log in
- `POST /api/auth/logout` - Log out
- `GET /api/auth/me` - Get current user (401 if not authenticated)

### Recipes
- `GET /api/recipes?scope=all|mine|following` - All recipes with optional filtering
- `GET /api/recipes/recent?scope=all|mine|following` - Recent recipes (limit 20)
- `GET /api/recipes/:id` - Single recipe
- `POST /api/recipes` - Create recipe (requires auth, sets createdByUserId from session)
- `POST /api/import-recipe` - Import recipe from URL via OpenAI (requires auth, OPENAI_API_KEY env)

### Social (Follow)
- `GET /api/users/search?q=query` - Search users by username (requires auth)
- `POST /api/follow` - Follow a user { userId } (requires auth, no self-follow)
- `POST /api/unfollow` - Unfollow a user { userId } (requires auth)
- `GET /api/following` - List users you follow (requires auth)

## Database
- PostgreSQL via DATABASE_URL
- Tables: users (username, passwordHash, displayName), recipes, follows (followerUserId, followingUserId, unique constraint)
- Schema changes applied via direct SQL

## Design
- Font: Plus Jakarta Sans (body), Playfair Display (headings)
- Sage green primary color (HSL 152 40% 46%)
- Mobile-first layout with iOS-style floating glassmorphic bottom tab bar
- Add Recipe uses full-screen Dialog (not drawer) to prevent close-on-scroll, with sticky Save footer
- Import from URL: fetches page, extracts JSON-LD/og:image, uses OpenAI to parse recipe
- Drawer-based modals for recipe detail, auth, people/following, and filter options
- Spring physics animations via Framer Motion
- Rounded-3xl drawers, rounded-2xl cards, pill-shaped filter chips
