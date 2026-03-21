# Influencer Marketplace - Setup & Deployment Guide

## Quick Start

### 1. Development Environment Setup

```bash
cd /sessions/trusting-epic-davinci/influencer-marketplace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Initialize database
npx prisma db push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### 2. Test Accounts (After Seeding)

**Influencer Account:**
- Email: `influencer1@example.com`
- Password: `password123`

**Company Account:**
- Email: `company1@example.com`
- Password: `password123`

## Key Features Implemented

### Authentication & Authorization
✓ NextAuth.js with credentials provider
✓ bcryptjs password hashing
✓ Role-based access (INFLUENCER/COMPANY)
✓ JWT sessions
✓ Protected routes with middleware

### Influencer Features
✓ Profile creation with multi-platform presence
✓ Showcase niche, followers, rate per post
✓ Receive collaboration proposals
✓ Accept/reject deals
✓ Track earnings and deal status

### Company Features
✓ Profile creation with industry and budget
✓ Search influencers by niche and followers
✓ Send proposals to influencers
✓ Manage outgoing proposals
✓ Track deal value and platform commission

### Platform Features
✓ 10% automatic commission calculation
✓ Deal status management (PENDING/ACCEPTED/REJECTED/COMPLETED)
✓ Real-time deal updates
✓ Dashboard analytics
✓ Responsive mobile design

## File Structure

### Pages & Routes

```
app/
├── (auth)/
│   ├── login/page.tsx              # Login form
│   └── register/
│       ├── page.tsx                # Role selection
│       ├── influencer/page.tsx      # Influencer registration
│       └── company/page.tsx         # Company registration
├── dashboard/
│   ├── influencer/page.tsx          # Influencer dashboard
│   └── company/page.tsx             # Company dashboard
├── influencers/
│   ├── page.tsx                    # Browse influencers
│   └── [id]/page.tsx               # Influencer profile
├── api/
│   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   ├── auth/register/route.ts       # User registration
│   ├── auth/user/route.ts           # Get current user
│   ├── influencers/
│   │   ├── route.ts                # List/search influencers
│   │   └── [id]/route.ts           # Get single influencer
│   └── deals/
│       ├── route.ts                # List/create deals
│       └── [id]/route.ts           # Update deal status
├── layout.tsx                      # Root layout with session provider
├── page.tsx                        # Landing page (hero, features, CTA)
├── providers.tsx                   # NextAuth session provider
└── globals.css                     # Global Tailwind CSS
```

### Components

```
components/
├── Navbar.tsx                      # Navigation bar with auth links
└── InfluencerCard.tsx              # Reusable influencer profile card
```

### Libraries & Utilities

```
lib/
├── auth.ts                         # NextAuth configuration & callbacks
├── prisma.ts                       # Prisma client singleton
```

### Database

```
prisma/
├── schema.prisma                   # Database schema (4 models)
└── seed.js                         # Sample data seeding
```

### Configuration

```
Root Level Files:
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS theme
├── postcss.config.js               # PostCSS plugins
├── tsconfig.json                   # TypeScript configuration
├── middleware.ts                   # Route protection middleware
├── package.json                    # Dependencies & scripts
├── .env.example                    # Environment template
├── .env.local                      # Local environment variables
├── .eslintrc.json                  # ESLint rules
└── .gitignore                      # Git ignore patterns
```

## Database Schema

### User
```prisma
model User {
  id: String @id @default(cuid())
  email: String @unique
  password: String (hashed with bcrypt)
  role: String ("INFLUENCER" | "COMPANY")
  createdAt: DateTime @default(now())

  influencerProfile: InfluencerProfile?
  companyProfile: CompanyProfile?
  sentDeals: Deal[] (as company)
  receivedDeals: Deal[] (as influencer)
}
```

### InfluencerProfile
```prisma
model InfluencerProfile {
  id: String @id @default(cuid())
  userId: String @unique (references User)
  name: String
  bio: String
  avatar: String? (URL)
  niche: String (e.g., "Fashion", "Tech", "Food")

  Social Accounts:
  - instagram?: String (handle)
  - youtube?: String (channel name)
  - twitter?: String (handle)
  - tiktok?: String (handle)
  - linkedin?: String (profile)

  Followers:
  - instagramFollowers?: Int
  - youtubeFollowers?: Int
  - twitterFollowers?: Int
  - tiktokFollowers?: Int

  ratePerPost: Float (₹)
  currency: String @default("INR")
  location?: String
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

### CompanyProfile
```prisma
model CompanyProfile {
  id: String @id @default(cuid())
  userId: String @unique (references User)
  companyName: String
  industry: String
  website?: String
  description: String
  budget: String (e.g., "10000-50000")
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

### Deal
```prisma
model Deal {
  id: String @id @default(cuid())
  companyId: String (references User as company)
  influencerId: String (references User as influencer)

  title: String
  description: String
  dealValue: Float (₹)
  commission: Float (10% of dealValue)

  status: String ("PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED")

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (influencer or company)
- `GET /api/auth/user` - Get current authenticated user
- `POST /api/auth/[...nextauth]` - NextAuth.js handler (login, logout, session)

### Influencers
- `GET /api/influencers` - List influencers (supports filters: ?niche=Fashion&minFollowers=10000)
- `GET /api/influencers/[id]` - Get single influencer profile

### Deals
- `GET /api/deals` - Get deals for authenticated user (sent or received)
- `POST /api/deals` - Create new deal proposal (company only)
- `PATCH /api/deals/[id]` - Update deal status (influencer only)

## Styling

### Tailwind CSS
- Custom color scheme: Purple/Indigo primary colors
- Responsive grid layouts (mobile-first)
- Pre-defined utility classes in `globals.css`:
  - `.btn-primary`, `.btn-secondary` - Button styles
  - `.card` - Card component style
  - `.input-field` - Form input style
  - `.gradient-bg`, `.gradient-text` - Gradient utilities

### Design Highlights
- Clean, modern aesthetic
- Hero section with CTA
- Feature cards highlighting platform benefits
- How-it-works section (4 steps each)
- Dashboard with statistics
- Responsive navigation bar

## Environment Variables

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here (generate with: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000 (change for production)

# Database
DATABASE_URL="file:./prisma/dev.db" (SQLite for dev)
```

## Development Scripts

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000

# Production
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma db push      # Sync database schema
npx prisma db seed      # Seed with sample data
npx prisma studio      # Open Prisma Studio (visual DB editor)

# Code Quality
npm run lint            # Run ESLint

# Build
npm run build           # Build for deployment
```

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Influencer Marketplace MVP"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import project from GitHub
   - Select the repository

3. **Set Environment Variables in Vercel Dashboard**
   ```
   NEXTAUTH_SECRET=[generate new secure key]
   NEXTAUTH_URL=https://your-domain.vercel.app
   DATABASE_URL=[PostgreSQL connection string for production]
   ```

4. **Configure Database for Production**
   - Recommended: PostgreSQL (update prisma/schema.prisma)
   - Run migrations: `npx prisma db push`
   - Seed production DB: `npm run db:seed`

5. **Deploy**
   - Vercel auto-deploys on git push to main

## Production Checklist

- [ ] Update `NEXTAUTH_SECRET` with a secure random value
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Switch database to PostgreSQL (or other production DB)
- [ ] Enable HTTPS (Vercel does this automatically)
- [ ] Set up CI/CD for automated testing
- [ ] Configure email notifications for deals
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Add analytics (e.g., Google Analytics)
- [ ] Review security headers and CORS settings
- [ ] Test payment integration (if adding payment processing)
- [ ] Create admin dashboard for moderation

## Known Limitations & Future Enhancements

### Current MVP
- SQLite database (suitable for development/small scale)
- Credentials-based authentication only
- No payment processing
- No image uploads (using placeholder avatars)
- No email notifications
- No real-time updates

### Future Enhancements
1. **Payment Integration**
   - Stripe or Razorpay integration
   - Automated payouts to influencers
   - Invoice generation

2. **Media Handling**
   - Image upload for profiles and portfolio
   - Video verification for influencers
   - Campaign media gallery

3. **Advanced Features**
   - Performance analytics and ROI tracking
   - Automated proposal matching
   - Rating and review system
   - Message/chat functionality
   - Contract templates

4. **Social Features**
   - OAuth integration (Google, Twitter, Instagram)
   - Social media verification
   - Portfolio showcase
   - Case studies and testimonials

5. **Admin Features**
   - Moderation dashboard
   - User management
   - Dispute resolution
   - Analytics and reports

## Troubleshooting

### Database Issues
```bash
# Reset database (development only)
rm prisma/dev.db
npx prisma db push
npm run db:seed
```

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# View database in GUI
npx prisma studio
```

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **NextAuth.js**: https://next-auth.js.org
- **Prisma ORM**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

**Version**: 1.0.0
**Last Updated**: March 2026
**Status**: Production Ready MVP
