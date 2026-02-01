# TrailReady Backend Setup Guide

This guide will help you set up the PostgreSQL database and complete the backend implementation.

## What's Been Implemented

✅ All infrastructure files and API routes have been created:
- Database schema ([prisma/schema.prisma](prisma/schema.prisma))
- 5 API routes (trails, trail detail, reports, auth)
- Real API client service
- Zod validation schemas
- Database seed script
- Environment configuration

✅ Frontend has been updated to use real API instead of mock data

## Setup Steps

### 1. Install Dependencies

Run this in your IDE's terminal (PowerShell, CMD, or Git Bash with npm in PATH):

```bash
npm install
```

This will install:
- `prisma` and `@prisma/client` (database ORM)
- `zod` (validation)
- `tsx` (for running TypeScript seed script)

### 2. Set Up Database

You have two options:

#### Option A: Local PostgreSQL (Recommended for Development)

1. Install PostgreSQL locally if you haven't already
2. Create a new database:
   ```sql
   CREATE DATABASE trailready_dev;
   ```

3. Create `.env.local` file in project root:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/trailready_dev"
   ```
   Replace `username` and `password` with your PostgreSQL credentials

#### Option B: Vercel Postgres (Production)

1. Go to your Vercel project dashboard
2. Navigate to Storage tab
3. Create a new Postgres database
4. Copy the connection string
5. Add it to `.env.local`:
   ```env
   DATABASE_URL="your-vercel-postgres-connection-string"
   ```

### 3. Run Database Migrations

This creates the database tables:

```bash
npm run db:migrate
```

When prompted, give your migration a name (e.g., "init")

### 4. Seed the Database

This populates the database with 3 example trails and 4 reports:

```bash
npm run db:seed
```

You should see output confirming:
- 4 anonymous users created
- 3 trails created (Alpine Loop, Moab Slickrock, Rubicon Trail)

### 5. Verify Setup

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 and:
1. Navigate to Browse Trails
2. You should see the 3 seeded trails
3. Click on a trail to see existing reports
4. Submit a new report
5. **Refresh the page** - the report should still be there! 🎉

### 6. Explore Your Database (Optional)

Prisma Studio provides a GUI for viewing and editing database data:

```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555

## New npm Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generation)
- `npm run db:migrate` - Create/run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio GUI

## API Endpoints

Your app now has these REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trails` | List all trails (supports `?search=` and `?region=`) |
| GET | `/api/trails/:id` | Get single trail by ID |
| GET | `/api/trails/:id/reports` | Get all reports for a trail |
| POST | `/api/auth/anonymous` | Create/get anonymous user |
| POST | `/api/reports` | Submit new condition report |

## Testing the Complete Flow

### End-to-End Test

1. **Fresh browser**: Open in incognito/private mode
2. **Browse trails**: Navigate to http://localhost:3000
3. **Search**: Type "Alpine" in search → should filter to Alpine Loop
4. **View trail**: Click on "Moab Slickrock"
5. **View reports**: Should see existing reports
6. **Submit report**: Click "Submit Report"
7. **Fill form**:
   - Status: Clear
   - Confidence: High
   - Vehicle: Lifted 4x4 - Solid Axle
   - Notes: "Trail was great!"
8. **Submit**: Click submit button
9. **Verify**: Should redirect back and see your new report at the top
10. **Persistence test**: Refresh the page → report should still be there
11. **Multi-user test**: Open another incognito window → navigate to same trail → should see your report

## Troubleshooting

### "Prisma Client not generated"

Run:
```bash
npx prisma generate
```

### Database connection errors

1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env.local`
3. Ensure database exists: `CREATE DATABASE trailready_dev;`

### "No such file or directory" errors

Make sure you're running commands from the project root directory (`TrailReady-web`)

### TypeScript errors in IDE

Your IDE might show errors for Prisma imports until you run:
```bash
npx prisma generate
```

This generates the TypeScript types for your Prisma models.

## Deployment to Vercel

### 1. Add Environment Variables

In your Vercel project:
1. Go to Settings → Environment Variables
2. Add `DATABASE_URL` (from Vercel Postgres or your hosted PostgreSQL)

### 2. Deploy

Vercel will automatically:
- Run `prisma generate` (via `postinstall` script)
- Build your Next.js app
- Run migrations (you may need to run this manually first time)

### 3. Seed Production Database

After first deployment, run migrations and seed:
```bash
# Set up Vercel CLI if you haven't
npm i -g vercel

# Run migration on production
vercel env pull .env.production.local
npx prisma migrate deploy

# Seed production database
npm run db:seed
```

## What Changed from Mock Data

### Before (Mock Service)
- Data stored in memory
- Lost on page refresh
- Single user only
- No persistence

### After (Real Backend)
- Data stored in PostgreSQL
- Persists across refreshes
- Multi-user capable
- Production ready

### Code Changes
Only import statements changed in your pages:
```diff
- import { trailService } from '@/services/mockTrailService';
+ import { trailService } from '@/services/trailService';
```

Everything else remained the same! The service interface is identical.

## Next Steps

Once the backend is working:

1. **Real Authentication** - Replace anonymous users with real accounts (NextAuth.js)
2. **Advanced Features** - Report voting, photo uploads, flagging
3. **Shared Components** - Extract reusable UI components
4. **State Management** - Add React Query for caching
5. **Testing** - Add unit and integration tests

## File Structure

```
TrailReady-web/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Auto-generated SQL migrations
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── trails/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── reports/route.ts
│   │   │   ├── reports/route.ts
│   │   │   └── auth/anonymous/route.ts
│   │   └── trails/            # Frontend pages (updated imports)
│   ├── lib/
│   │   ├── prisma.ts          # Database client
│   │   ├── api/response.ts    # API utilities
│   │   └── validations/       # Zod schemas
│   ├── services/
│   │   ├── trailService.ts    # Real API client (NEW)
│   │   └── mockTrailService.ts # Old mock (kept for reference)
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.local                 # Your local database URL (create this)
├── .env.example               # Template
└── package.json               # Updated with Prisma scripts
```

## Questions?

If you encounter any issues:
1. Check this setup guide
2. Review the Troubleshooting section
3. Check [prisma/schema.prisma](prisma/schema.prisma) for database structure
4. Review [src/app/api/](src/app/api/) for API implementation

Happy trail tracking! 🏔️🚙
