# Eureka - Personal Knowledge Base

Modern web application for managing personal knowledge with a wiki-like interface and graph visualization of interconnected pages.

![Version](https://img.shields.io/badge/version-2.1.7-blue)
![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)

## Documentation

📚 **[Documentation Index](DOCS_INDEX.md)** - Complete guide to all documentation

- **[Quick Start](QUICKSTART.md)** - Get started in 3 minutes ⚡
- **[User Guide](USER_GUIDE.md)** - Complete user manual in Russian 📖
- **[Architecture](ARCHITECTURE.md)** - System architecture and design 🏗️
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete project overview and statistics 📊
- **[Technical Improvements](IMPROVEMENTS.md)** - Detailed changelog and roadmap 📋
- **README.md** (this file) - Developer documentation and setup guide 🔧

## Features

### Core Functionality
- **Wiki-style Pages**: Create, edit, and organize knowledge in Markdown format
- **Graph Visualization**: Interactive D3.js graph showing connections between pages
- **Full-Text Search**: Quickly find pages by title with debounced search
- **Markdown Support**: Rich text formatting with live preview
- **User Authentication**: Secure JWT-based authentication system
- **Auto-save**: Never lose your work with automatic saving (2-second debounce)

### User Experience
- **Modern UI**: Material Design-inspired interface with consistent design system
- **Toast Notifications**: Real-time feedback for all operations
- **Keyboard Shortcuts**:
  - `Ctrl+S` - Save page
  - `Ctrl+B` - Bold text
  - `Ctrl+I` - Italic text
  - `Ctrl+K` - Insert link
- **Loading States**: Smooth spinners for async operations
- **Empty States**: Helpful prompts when no data exists
- **Modal Dialogs**: Clean modals for creating new pages
- **Responsive Design**: Works on desktop and mobile devices

### Developer Features
- **Type Safety**: Full TypeScript on frontend, generated types from SQL on backend
- **Request Tracing**: Unique request IDs for debugging
- **Structured Logging**: HTTP request/response logging with timing
- **Error Recovery**: Panic recovery middleware prevents server crashes
- **Hot Reload**: Vite HMR for frontend, live reload for development

## Tech Stack

### Frontend
- **React 19.1** - UI library
- **TypeScript 5.7** - Type safety
- **Vite** - Build tool and dev server
- **React Router 7** - Client-side routing
- **D3.js** - Graph visualization
- **Marked** - Markdown parsing
- **DOMPurify** - XSS protection
- **Axios** - HTTP client

### Backend
- **Go 1.22** - Server language
- **Chi** - HTTP router
- **PostgreSQL 16** - Database
- **sqlc** - Type-safe SQL
- **golang-jwt** - JWT authentication
- **bcrypt** - Password hashing
- **google/uuid** - Request ID generation

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Frontend server
- **Make** - Task automation

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Make (optional, but recommended)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Eureka
```

2. **Create environment file**
```bash
cp .env.example .env
```

Edit `.env` and set your values:
```env
# Database
POSTGRES_USER=eureka_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=eureka_db

# API
JWT_SECRET=your_jwt_secret_key_here
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=your_admin_password

# Ports
API_PORT=8081
WEB_PORT=8082
```

3. **Launch the application**
```bash
make up
```

This will:
- Build all Docker images
- Start PostgreSQL database
- Run database migrations
- Start API server on port 8081
- Start web server on port 8082

4. **Access the application**
- **Web UI**: http://localhost:8082
- **API**: http://localhost:8081
- **Health check**: http://localhost:8081/healthz

5. **Login**
Use the admin credentials from your `.env` file:
- Email: `admin@local` (or your ADMIN_EMAIL)
- Password: (your ADMIN_PASSWORD)

### Other Commands

```bash
# Stop all services
make down

# View API logs
make logs

# Rebuild and restart
make rebuild

# Run database migrations manually
make migrate-up

# Rollback last migration
make migrate-down
```

## Project Structure

```
Eureka/
├── api/                      # Go backend
│   ├── cmd/
│   │   └── api/
│   │       └── main.go      # Entry point
│   ├── internal/
│   │   ├── config/          # Configuration
│   │   ├── database/        # Database connection
│   │   ├── errors/          # Error handling system
│   │   ├── http/            # HTTP handlers & router
│   │   ├── middleware/      # HTTP middleware
│   │   │   ├── logger.go   # Request logging
│   │   │   ├── recovery.go # Panic recovery
│   │   │   └── requestid.go# Request ID tracing
│   │   ├── models/          # Data models (sqlc generated)
│   │   └── service/         # Business logic
│   ├── migrations/          # SQL migrations
│   └── queries/             # SQL queries (sqlc)
├── web/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # UI Kit components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── ToastContainer.tsx
│   │   │   └── Toolbar.tsx # Markdown toolbar
│   │   ├── hooks/
│   │   │   ├── useAuth.ts  # Authentication hook
│   │   │   ├── useDebounce.ts # Debouncing hook
│   │   │   └── useToast.tsx   # Toast notifications hook
│   │   ├── lib/
│   │   │   └── api.ts      # Axios instance
│   │   ├── pages/
│   │   │   ├── App.tsx     # Main layout
│   │   │   ├── Editor.tsx  # Page editor
│   │   │   ├── Graph.tsx   # Graph visualization
│   │   │   ├── Home.tsx    # Page list
│   │   │   ├── Login.tsx   # Login page
│   │   │   └── Register.tsx# Registration page
│   │   └── styles/
│   │       └── theme.ts    # Design system tokens
│   └── public/
├── deploy/                  # Deployment configs
├── docker-compose.yml
├── Makefile
└── IMPROVEMENTS.md         # Detailed changelog
```

## API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login user
```

### Pages
```
GET    /api/pages            # List all pages
POST   /api/pages            # Create new page
GET    /api/pages/:id        # Get page by ID
PUT    /api/pages/:id        # Update page
DELETE /api/pages/:id        # Delete page
```

### Links
```
GET    /api/links            # Get all page links (for graph)
```

### Health
```
GET    /healthz              # Health check
```

All protected endpoints require `Authorization: Bearer <token>` header.

## Architecture

### Design System

The project uses a centralized design system defined in [theme.ts](web/src/styles/theme.ts):

**Colors:**
- Primary (Blue): Actions and links
- Neutral (Gray): Text and backgrounds
- Success (Green): Successful operations
- Danger (Red): Errors and dangerous actions
- Warning (Orange): Warnings

**Spacing:** Based on 4px grid (xs: 4, sm: 8, md: 12, lg: 16, xl: 24)

**Typography:** System font stack with defined sizes and weights

### UI Components

All UI components are reusable and follow consistent design patterns:

```typescript
// Example: Button component
<Button
  variant="primary"    // primary | secondary | danger | ghost
  size="md"            // sm | md | lg
  loading={isLoading}  // Shows spinner
  fullWidth={true}     // Takes full width
  onClick={handleClick}
>
  Click me
</Button>
```

### Hooks

**useAuth** - Authentication state management
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

**useToast** - Toast notifications
```typescript
const toast = useToast();
toast.success("Page created!");
toast.error("Failed to save");
toast.info("Auto-saving...");
toast.warning("Name is required");
```

**useDebounce** - Debounce values
```typescript
const debouncedSearch = useDebounce(searchTerm, 500);
```

### Middleware Chain

Backend uses layered middleware for cross-cutting concerns:

```
Request → Recovery → RequestID → Logger → CORS → Auth → Handler
```

1. **Recovery**: Catches panics, prevents crashes
2. **RequestID**: Adds unique ID to each request
3. **Logger**: Logs method, path, status, duration, size
4. **CORS**: Handles cross-origin requests
5. **Auth**: Validates JWT tokens

### Error Handling

Structured error system with predefined errors:

```go
// Backend
return errors.ErrNotFound.WithMessage("Page not found")

// Response
{
  "code": "not_found",
  "message": "Page not found"
}
```

## Development

### Frontend Development

```bash
cd web
npm install
npm run dev
```

Frontend dev server runs on http://localhost:5173 with HMR.

### Backend Development

```bash
cd api
go mod download
go run cmd/api/main.go
```

### Database Migrations

Create new migration:
```bash
migrate create -ext sql -dir api/migrations -seq migration_name
```

### Generate Models from SQL

After updating queries in `api/queries/`:
```bash
cd api
sqlc generate
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | eureka_user |
| `POSTGRES_PASSWORD` | Database password | - |
| `POSTGRES_DB` | Database name | eureka_db |
| `JWT_SECRET` | Secret for JWT signing | - |
| `ADMIN_EMAIL` | Initial admin email | admin@local |
| `ADMIN_PASSWORD` | Initial admin password | - |
| `API_PORT` | API server port | 8081 |
| `WEB_PORT` | Web server port | 8082 |

### Docker Services

**db** - PostgreSQL 16
- Port: 5432 (internal)
- Volume: `postgres_data` for persistence
- Health check enabled

**api** - Go backend
- Port: 8081
- Depends on: db
- Auto-restarts on failure

**web** - Nginx + React
- Port: 8082
- Nginx serves static files
- Depends on: api

## Features in Detail

### Auto-save

Editor automatically saves changes after 2 seconds of inactivity. Status indicator shows:
- "Есть изменения" - Unsaved changes
- "Сохранение..." - Saving in progress
- "Сохранено" - Saved successfully

### Graph Visualization

Interactive graph shows relationships between pages:
- **Zoom**: Scroll to zoom in/out
- **Pan**: Drag to move around
- **Click node**: Navigate to that page
- **Hover**: Highlight node

### Markdown Toolbar

Rich formatting options:
- Headers (H1, H2, H3)
- Bold, Italic, Strikethrough
- Lists (bullet, numbered)
- Links, Images
- Code blocks
- Quotes
- Horizontal rules

### Search

Debounced search filters pages by title as you type. No need to press Enter.

### Toast Notifications

All operations provide feedback:
- Page created/updated/deleted
- Login/logout
- Errors
- Warnings

## Security

- **Password Hashing**: bcrypt with cost 10
- **JWT Tokens**: Signed with secret, 24-hour expiration
- **XSS Protection**: DOMPurify sanitizes rendered Markdown
- **SQL Injection**: sqlc generates safe parameterized queries
- **CORS**: Configured for localhost development
- **Panic Recovery**: Prevents information leakage from panics

## Performance

- **Debouncing**: Search and auto-save debounced to reduce API calls
- **Memoization**: Graph component memoized to prevent unnecessary re-renders
- **Lazy Loading**: Routes code-split for faster initial load
- **Indexed Queries**: Database queries optimized with indexes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Troubleshooting

### Port already in use
```bash
# Change ports in .env file
API_PORT=8091
WEB_PORT=8092

# Or stop conflicting services
lsof -ti:8081 | xargs kill
```

### Database connection failed
```bash
# Check database is running
docker-compose ps

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Frontend not updating
```bash
# Clear browser cache
# Or hard reload: Ctrl+Shift+R

# Rebuild containers
make rebuild
```

### API returns 401 Unauthorized
- Check JWT_SECRET is same in .env and running container
- Token may be expired, try logging in again
- Check Authorization header format: `Bearer <token>`

## License

This project is licensed under the MIT License.

## Changelog

See [IMPROVEMENTS.md](IMPROVEMENTS.md) for detailed changelog and roadmap.

### Version 2.1.1 (2025-10-23)
- Fixed "Cannot read properties of null" error in Home.tsx
- Added null/undefined checks in filteredPages
- App now correctly handles empty page lists

### Version 2.1 (2025-10-22)
- Added Modal component for better UX
- Backend middleware: Logger, Recovery, RequestID
- Structured error handling system
- Fixed TypeScript strict mode issues

### Version 2.0 (2025-10-22)
- Complete UI/UX overhaul with Design System
- Toast notifications system
- Auto-save in editor
- Keyboard shortcuts
- Search functionality
- Graph improvements with zoom/pan
- Custom hooks (useAuth, useToast, useDebounce)

## Acknowledgments

- Built with modern Go and React best practices
- Inspired by note-taking apps like Obsidian and Roam Research
- Graph visualization powered by D3.js force simulation

---

**Status**: ✅ Production ready
**Maintained**: Yes
**Last Updated**: October 22, 2025
