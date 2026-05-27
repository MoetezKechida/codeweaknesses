# CodeWeaknesses Frontend

A production-ready Next.js frontend for the CodeWeaknesses competitive coding platform.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **API Client**: Axios with interceptors
- **Code Editor**: Monaco Editor
- **Authentication**: JWT with httpOnly cookies
- **Type Safety**: TypeScript

## Features

- ✅ **Authentication**: Secure JWT-based login/register with httpOnly cookies
- ✅ **Protected Routes**: Middleware-based route protection
- ✅ **Real-time Notifications**: SSE integration for live updates
- ✅ **Code Editor**: Monaco Editor with syntax highlighting and multi-language support
- ✅ **Problem Solving**: Browse, filter, and solve problems
- ✅ **Contest Management**: View and participate in contests
- ✅ **Submission History**: Track all submissions and results
- ✅ **Responsive Design**: Mobile-friendly UI with dark theme
- ✅ **TanStack Query**: Efficient server state management with caching
- ✅ **Error Handling**: Comprehensive error boundaries and user feedback

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn installed
- Backend API running on `http://localhost:3000` (or configured in `.env.local`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your backend API URL (default is already set):
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

Run the development server on port 3001:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Landing page
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   ├── dashboard/            # Protected dashboard layout
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── problems/         # Problems listing and detail
│   │   │   ├── contests/         # Contests listing and detail
│   │   │   ├── submissions/      # Submissions listing and detail
│   │   │   └── layout.tsx        # Dashboard layout with sidebar
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts           # Authentication hook
│   │   ├── use-problems.ts       # Problems query hooks
│   │   ├── use-contests.ts       # Contests query hooks
│   │   └── use-submissions.ts    # Submissions query hooks
│   ├── lib/
│   │   ├── api.ts                # API client setup with axios
│   │   ├── query-client.ts       # TanStack Query configuration
│   │   └── utils.ts              # Utility functions
│   ├── providers/
│   │   └── query-provider.tsx    # Query client provider
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   └── middleware.ts             # Next.js middleware for auth
├── public/                        # Static assets
├── .env.local                     # Environment variables (local)
├── .env.example                   # Environment template
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Project dependencies
```

## Key Features Explained

### Authentication Flow
1. User submits credentials on `/login` or `/register`
2. Backend returns JWT token set in httpOnly cookie
3. Middleware (`middleware.ts`) checks authentication on protected routes
4. API client automatically attaches token to requests
5. 401 responses redirect to `/login` and clear cookies

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/login`, `/register` - Redirect to dashboard if already authenticated
- Public routes: `/`, `/problems` (can browse without login)

### Data Fetching with TanStack Query
All data fetching uses TanStack Query hooks with automatic:
- Request deduplication
- Response caching (5 minutes)
- Automatic refetching on window focus
- Background refetching for submissions (2 seconds when pending)

### Real-time Updates
- Submissions auto-refresh while pending
- Configurable SSE integration in `lib/api.ts`
- WebSocket support ready in the backend

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Backend API endpoint |

## Backend Integration

### Expected API Endpoints

The frontend expects these API endpoints from the backend:

**Authentication**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

**Problems**
- `GET /problems` - List problems (with pagination)
- `GET /problems/:id` - Get problem details
- `POST /problems` - Create problem (admin)
- `PATCH /problems/:id` - Update problem
- `DELETE /problems/:id` - Delete problem
- `POST /problems/:id/test-cases` - Create test case

**Contests**
- `GET /contests` - List contests
- `GET /contests/:id` - Get contest details
- `POST /contests` - Create contest
- `PATCH /contests/:id` - Update contest
- `DELETE /contests/:id` - Delete contest

**Submissions**
- `GET /submissions` - List submissions
- `GET /submissions/:id` - Get submission details
- `POST /submissions` - Create submission

**Users**
- `GET /users` - List users
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user

### Cookie Requirements

The backend must set JWT token as httpOnly cookie:
```javascript
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

## Customization

### Adding New Pages
1. Create new directory under `src/app/dashboard/`
2. Add `page.tsx` file
3. Use existing hooks for data fetching
4. Update sidebar navigation in `dashboard/layout.tsx`

### Adding New Features
1. Create query hooks in `src/hooks/`
2. Add API methods in `src/lib/api.ts`
3. Create components in `src/components/`
4. Add types in `src/types/index.ts`

### UI Customization
- Theme colors: Edit Tailwind classes (using Slate 950 + Blue/Cyan accents)
- Add more shadcn/ui components: `npx shadcn@latest add [component]`
- Fonts: Configured in `src/app/layout.tsx`

## Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Query caching (5 minutes default)
- Submission refetch interval (2 seconds when pending)
- Monaco Editor lazy loading via @monaco-editor/react

## Security Considerations

- ✅ JWT stored in httpOnly cookies (XSS protection)
- ✅ CSRF protection via SameSite cookie policy
- ✅ Protected routes with middleware
- ✅ Secure API client with interceptors
- ✅ No sensitive data in localStorage
- ✅ Type-safe API calls

## Troubleshooting

### Backend Connection Issues
1. Ensure backend is running on `http://localhost:3000`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS configuration in backend
4. Check browser console for detailed errors

### Authentication Problems
1. Check if cookies are being set (DevTools > Application > Cookies)
2. Verify backend returns httpOnly cookies
3. Check middleware is properly configured
4. Look for 401 errors in Network tab

### Module Not Found Errors
1. Run `npm install` to ensure all dependencies are installed
2. Clear `.next` folder: `rm -rf .next`
3. Restart development server

## Contributing

When adding features:
1. Follow the existing code structure
2. Add TypeScript types for all data
3. Create hooks for data fetching
4. Use shadcn/ui components where possible
5. Update this README if adding new features

## License

MIT License - See LICENSE file in root project
