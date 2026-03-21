# Influencer Marketplace

A modern full-stack influencer marketplace connecting brands with creators.

## Features

- **For Influencers**: Create profile, showcase platforms, receive collaboration proposals, manage deals
- **For Brands**: Search influencers, send proposals, manage campaigns, track investments
- **Platform Commission**: 10% commission on all deals
- **Multi-Platform Support**: Instagram, YouTube, TikTok, Twitter, LinkedIn
- **Secure Authentication**: NextAuth.js with credentials provider

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Security**: bcryptjs for password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update `NEXTAUTH_SECRET` with a secure value.

4. Initialize the database:
   ```bash
   npx prisma db push
   npx npm run db:seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication routes
│   ├── api/                      # API routes
│   ├── dashboard/                # User dashboards
│   ├── influencers/              # Influencer pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # Reusable components
├── lib/                          # Utilities
├── prisma/                       # Database schema and seed
├── types/                        # TypeScript types
├── middleware.ts                 # Route protection
└── tsconfig.json                 # TypeScript config
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/user` - Get current user
- `POST /api/auth/[...nextauth]` - NextAuth handler

### Influencers
- `GET /api/influencers` - List/search influencers
- `GET /api/influencers/[id]` - Get influencer profile

### Deals
- `GET /api/deals` - List user's deals
- `POST /api/deals` - Create new deal proposal
- `PATCH /api/deals/[id]` - Update deal status

## Sample Data

Default test accounts:
- **Influencer**: influencer1@example.com / password123
- **Company**: company1@example.com / password123

## Deployment

The application is ready for deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

For production:
- Update `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- Use a production database (PostgreSQL recommended)
- Enable HTTPS
- Review security settings

## Database Schema

- **User**: Core user account (email, password, role)
- **InfluencerProfile**: Profile data for influencers
- **CompanyProfile**: Profile data for brands
- **Deal**: Collaboration proposals between companies and influencers

## License

MIT
