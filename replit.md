# Recipease - Recipe Management App

## Overview
A mobile-first recipe management web app with a premium, minimal design. Features three main sections: Discover (Tinder-style swipe cards), All Recipes (searchable list), and Recent (grid feed). Uses a bottom tab bar for navigation and drawer-based recipe detail views.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Framer Motion, Vaul (drawer), Shadcn UI
- **Backend**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: Wouter (frontend), Express (backend API)

## Project Structure
- `client/src/App.tsx` - Main app with tab navigation
- `client/src/pages/` - Discover, All Recipes, Recent pages
- `client/src/components/` - Shared components (bottom tab bar, recipe detail sheet, add recipe form, placeholder images)
- `server/routes.ts` - API endpoints (/api/recipes, /api/recipes/recent)
- `server/storage.ts` - Database storage layer
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data (3 example recipes)
- `shared/schema.ts` - Drizzle schema definitions (users, recipes)

## API Routes
- `GET /api/recipes` - All recipes (sorted by createdAt desc)
- `GET /api/recipes/recent` - Recent recipes (limit 20)
- `GET /api/recipes/:id` - Single recipe
- `POST /api/recipes` - Create recipe

## Database
- PostgreSQL via DATABASE_URL
- Tables: users, recipes
- Schema pushed via `npx drizzle-kit push`

## Design
- Font: Plus Jakarta Sans (body), Playfair Display (headings)
- Warm orange primary color (#E67E22-ish via HSL 24 90% 48%)
- Mobile-first layout with iOS-style bottom tab bar
- Drawer-based modals for recipe detail and add recipe form
