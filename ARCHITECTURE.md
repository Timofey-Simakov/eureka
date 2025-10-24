# Eureka - Архитектура проекта

## 📐 Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    http://localhost:8082                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (Port 8082)                        │
│                   Serves Static Files                        │
│                 (React Build + Assets)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ API Calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Go API Server (Port 8081)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Middleware Chain                       │    │
│  │  Recovery → RequestID → Logger → CORS → Auth       │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │                 HTTP Handlers                       │    │
│  │  /auth/login  /auth/register  /pages  /links       │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Service Layer                          │    │
│  │         (Business Logic)                            │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Database Layer                           │    │
│  │         (sqlc generated code)                       │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL 16 (Port 5432)                       │
│                                                              │
│  Tables: users, pages, links                                │
│  Indexes: Primary keys, foreign keys                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

```
web/
├── src/
│   ├── styles/
│   │   └── theme.ts ──────────────┐
│   │       (Design System)        │ Используется во всех компонентах
│   │                               │
│   ├── components/                 │
│   │   ├── ui/ ────────────────────┤
│   │   │   ├── Button.tsx         │
│   │   │   ├── Input.tsx          │
│   │   │   ├── Card.tsx           │
│   │   │   ├── Spinner.tsx        │
│   │   │   ├── EmptyState.tsx     │
│   │   │   ├── Modal.tsx          │
│   │   │   ├── Toast.tsx          │
│   │   │   └── ToastContainer.tsx │
│   │   │                           │
│   │   └── Toolbar.tsx ────────────┘
│   │
│   ├── hooks/
│   │   ├── useAuth.ts ──────────┐
│   │   ├── useToast.tsx         │ Используется в pages
│   │   └── useDebounce.ts ──────┘
│   │
│   ├── pages/
│   │   ├── App.tsx           (Main Layout + Router)
│   │   ├── Login.tsx         (Authentication)
│   │   ├── Register.tsx      (User Registration)
│   │   ├── Home.tsx          (Pages List + Search)
│   │   ├── Editor.tsx        (Page Editor + Autosave)
│   │   └── Graph.tsx         (D3 Visualization)
│   │
│   ├── lib/
│   │   └── api.ts            (Axios instance + interceptors)
│   │
│   └── main.tsx              (Entry point)
```

### Component Dependency Graph

```
main.tsx
  │
  └─► App.tsx
       │
       ├─► Login.tsx
       │    └─► uses: Card, Input, Button, useToast
       │
       ├─► Register.tsx
       │    └─► uses: Card, Input, Button, useToast
       │
       ├─► Home.tsx
       │    ├─► uses: Input, Button, Modal, Spinner, EmptyState
       │    └─► uses: useDebounce, useToast
       │
       ├─► Editor.tsx
       │    ├─► uses: Button, Spinner, Toolbar
       │    └─► uses: useDebounce, useToast
       │
       └─► Graph.tsx
            └─► uses: D3.js, Spinner, useToast
```

---

## 🔧 Backend Architecture

```
api/
├── cmd/
│   └── server/
│       └── main.go ────────────────┐
│                                   │
├── internal/                       │
│   ├── config/                     │
│   │   └── config.go               │ Загружается в main.go
│   │                                │
│   ├── database/                   │
│   │   └── db.go ──────────────────┤
│   │                                │
│   ├── middleware/                 │
│   │   ├── logger.go ───────┐      │
│   │   ├── recovery.go       │      │
│   │   └── requestid.go ─────┤      │
│   │                          │      │
│   ├── errors/                │      │
│   │   └── errors.go ─────────┤      │
│   │                          │      │
│   ├── http/                 │      │
│   │   ├── router.go ◄───────┴──────┤
│   │   ├── auth_handler.go          │
│   │   ├── page_handler.go          │
│   │   └── link_handler.go          │
│   │                                 │
│   ├── service/                      │
│   │   └── service.go ◄──────────────┤
│   │                                 │
│   └── models/ ◄─────────────────────┘
│       └── (sqlc generated)
│
├── queries/
│   └── *.sql ──────────┐
│                       │
├── migrations/         │
│   └── *.sql          │
│                       │
└── sqlc.yaml ◄─────────┘
    (generates models from queries)
```

### Request Flow

```
HTTP Request
  │
  ▼
Router (Chi)
  │
  ├─► Middleware Chain
  │    │
  │    ├─► Recovery (catch panics)
  │    ├─► RequestID (add UUID)
  │    ├─► Logger (log request)
  │    ├─► CORS (handle CORS)
  │    └─► Auth (validate JWT) ◄─── только для защищенных роутов
  │
  ▼
Handler
  │
  ├─► Parse Request
  ├─► Validate Input
  │
  ▼
Service Layer
  │
  ├─► Business Logic
  ├─► Call Database
  │
  ▼
Database (sqlc)
  │
  ├─► Execute Query
  ├─► Map to Model
  │
  ▼
Response
  │
  └─► JSON / Error
```

---

## 🗃️ Database Schema

```sql
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id         SERIAL PK    │
│ email      VARCHAR      │◄────┐
│ password   VARCHAR      │     │
│ created_at TIMESTAMP    │     │
└─────────────────────────┘     │
                                 │
                                 │ Foreign Key
                                 │
┌─────────────────────────┐     │
│        pages            │     │
├─────────────────────────┤     │
│ id         SERIAL PK    │     │
│ name       VARCHAR      │     │
│ body       TEXT         │     │
│ user_id    INTEGER ─────┼─────┘
│ created_at TIMESTAMP    │
│ updated_at TIMESTAMP    │
└─────────────────────────┘
         │
         │ Referenced by links
         ▼
┌─────────────────────────┐
│        links            │
├─────────────────────────┤
│ id         SERIAL PK    │
│ from_id    INTEGER ─────┼──┐
│ to_id      INTEGER ─────┼──┼─► References pages.id
│ created_at TIMESTAMP    │  │
└─────────────────────────┘  │
         ▲                   │
         └───────────────────┘
```

### Indexes

```
users:
  - PRIMARY KEY (id)
  - UNIQUE (email)

pages:
  - PRIMARY KEY (id)
  - INDEX (user_id)

links:
  - PRIMARY KEY (id)
  - INDEX (from_id, to_id)
  - FOREIGN KEY (from_id) REFERENCES pages(id) ON DELETE CASCADE
  - FOREIGN KEY (to_id) REFERENCES pages(id) ON DELETE CASCADE
```

---

## 🔐 Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────┐
│   Auth Handler      │
│                     │
│ 2. Validate input   │
│ 3. Query user       │──────► Database
│ 4. Check password   │◄────── (bcrypt compare)
│ 5. Generate JWT     │
└──────┬──────────────┘
       │
       │ 6. Return { token, user }
       ▼
┌─────────────┐
│   Browser   │
│             │
│ 7. Store token in localStorage
│ 8. Add to axios headers
└──────┬──────┘
       │
       │ 9. Subsequent requests
       │    Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│  Auth Middleware    │
│                     │
│ 10. Extract token   │
│ 11. Verify JWT      │
│ 12. Get user_id     │
│ 13. Add to context  │
└──────┬──────────────┘
       │
       │ 14. Continue to handler
       ▼
┌─────────────────────┐
│    Handler          │
│                     │
│ 15. Get user from context
│ 16. Process request │
└─────────────────────┘
```

---

## 🎨 Design System Architecture

```
theme.ts
  │
  ├─► colors
  │    ├─► primary (9 shades)
  │    ├─► neutral (9 shades)
  │    ├─► success (9 shades)
  │    ├─► danger (9 shades)
  │    └─► warning (9 shades)
  │
  ├─► typography
  │    ├─► fontFamily
  │    ├─► fontSize (5 sizes)
  │    └─► fontWeight (3 weights)
  │
  ├─► spacing (6 levels)
  │    xs, sm, md, lg, xl, 2xl
  │
  ├─► borderRadius (3 sizes)
  │    sm, md, lg
  │
  ├─► shadows (4 levels)
  │    sm, md, lg, xl
  │
  └─► transitions
       default, fast, slow

       ▼ Used by all UI components

┌─────────────────────────────────┐
│      UI Components              │
├─────────────────────────────────┤
│ Button.tsx                      │
│ Input.tsx                       │
│ Card.tsx                        │
│ Spinner.tsx                     │
│ EmptyState.tsx                  │
│ Modal.tsx                       │
│ Toast.tsx                       │
│ ToastContainer.tsx              │
└─────────────────────────────────┘
```

---

## 🔄 State Management

### Authentication State

```
useAuth Hook (Context API)
  │
  ├─► State:
  │    ├─► user: User | null
  │    ├─► token: string | null
  │    └─► isAuthenticated: boolean
  │
  └─► Actions:
       ├─► login(email, password)
       ├─► register(email, password)
       └─► logout()

  Used by:
    - App.tsx (routing)
    - Login.tsx
    - Register.tsx
    - All protected pages
```

### Toast State

```
useToast Hook (Context API)
  │
  ├─► State:
  │    └─► toasts: ToastMessage[]
  │
  └─► Actions:
       ├─► success(message)
       ├─► error(message)
       ├─► info(message)
       ├─► warning(message)
       └─► removeToast(id)

  Used by:
    - All pages (user feedback)
    - API interceptors (errors)
```

### Page State (Local)

```
Home.tsx
  ├─► pages: Page[]
  ├─► searchTerm: string
  ├─► loading: boolean
  ├─► isCreateModalOpen: boolean
  └─► newPageName: string

Editor.tsx
  ├─► page: Page | null
  ├─► name: string
  ├─► body: string
  ├─► loading: boolean
  ├─► saving: boolean
  └─► hasChanges: boolean

Graph.tsx
  ├─► nodes: Node[]
  ├─► links: Link[]
  └─► loading: boolean
```

---

## 🚀 Build & Deploy

```
Development:
  ├─► Frontend
  │    npm run dev
  │    Vite dev server (HMR)
  │    http://localhost:5173
  │
  └─► Backend
       go run cmd/server/main.go
       Air (live reload)
       http://localhost:8080

Production (Docker):
  │
  ├─► Build Stage
  │    ├─► Frontend
  │    │    node:20
  │    │    npm ci && npm run build
  │    │    → /app/dist
  │    │
  │    └─► Backend
  │         golang:1.22
  │         go build
  │         → /bin/api
  │
  └─► Runtime Stage
       ├─► Frontend
       │    nginx:1.27-alpine
       │    Serves static files
       │    Port: 8082
       │
       ├─► Backend
       │    distroless/base-debian12
       │    Runs compiled binary
       │    Port: 8081
       │
       └─► Database
            postgres:16
            Persistent volume
            Port: 5432 (internal)
```

### Docker Compose Flow

```
make up
  │
  ├─► 1. Build images
  │     ├─► api (multi-stage)
  │     └─► web (multi-stage)
  │
  ├─► 2. Start database
  │     └─► Wait for healthy
  │
  ├─► 3. Run migrations
  │     └─► golang-migrate
  │
  ├─► 4. Start API
  │     └─► Depends on: db
  │
  └─► 5. Start Web
       └─► Depends on: api

Health Checks:
  ├─► db: pg_isready
  ├─► api: /healthz endpoint
  └─► web: nginx status
```

---

## 📊 Data Flow Examples

### Creating a Page

```
User clicks "Создать страницу"
  │
  ▼
Modal opens
  │
User enters name → validate (not empty)
  │
  ▼
Click "Создать"
  │
  ▼
POST /api/pages
  {
    "name": "New Page",
    "body": ""
  }
  │
  ▼
Backend:
  Recovery → RequestID → Logger → CORS → Auth
  │
  ▼
Page Handler
  │
  ├─► Parse JSON
  ├─► Validate
  ├─► Get user_id from context
  │
  ▼
Service Layer
  │
  └─► INSERT INTO pages (name, body, user_id)
  │
  ▼
Return new page with ID
  │
  ▼
Frontend:
  │
  ├─► Show success toast
  ├─► Close modal
  ├─► Navigate to /editor/:id
  └─► Update pages list
```

### Autosave Flow

```
User types in editor
  │
  ▼
onChange event
  │
  ├─► Update local state (name/body)
  ├─► Set hasChanges = true
  │
  ▼
useDebounce (2000ms)
  │
Wait for user to stop typing...
  │
  ▼
Debounced value changes
  │
  ▼
useEffect triggers
  │
  ├─► Set saving = true
  ├─► Show "Сохранение..."
  │
  ▼
PUT /api/pages/:id
  {
    "name": "Updated Name",
    "body": "Updated content..."
  }
  │
  ▼
Backend updates page
  │
  ▼
Success
  │
  ├─► Set saving = false
  ├─► Set hasChanges = false
  ├─► Show "Сохранено"
  └─► Toast: "Страница сохранена"
```

---

## 🔧 Error Handling Architecture

```
Frontend Error Handling:
  │
  ├─► API Interceptor (axios)
  │    └─► Catches all HTTP errors
  │         └─► Shows error toast
  │
  ├─► Try/Catch blocks
  │    └─► In async functions
  │         ├─► Log error
  │         └─► Show error toast
  │
  └─► Form validation
       └─► Inline error display
            └─► Input component error prop

Backend Error Handling:
  │
  ├─► Recovery Middleware
  │    └─► Catches panics
  │         ├─► Log stack trace
  │         └─► Return 500
  │
  ├─► Structured Errors (errors.go)
  │    └─► AppError type
  │         ├─► code
  │         ├─► message
  │         └─► status
  │
  └─► Handler level
       └─► Return appropriate error
            ├─► ErrBadRequest (400)
            ├─► ErrUnauthorized (401)
            ├─► ErrNotFound (404)
            └─► ErrInternalServer (500)
```

---

## 🎯 Performance Optimizations

### Frontend

```
1. Debouncing
   ├─► Search: 500ms
   └─► Autosave: 2000ms

2. Memoization
   └─► Graph component (React.memo)

3. Code Splitting
   └─► Route-based lazy loading

4. Optimized Renders
   ├─► useCallback for handlers
   └─► useMemo for expensive calculations
```

### Backend

```
1. Database Indexes
   ├─► users(email)
   ├─► pages(user_id)
   └─► links(from_id, to_id)

2. Type-safe Queries
   └─► sqlc (compile-time checks)

3. Connection Pooling
   └─► PostgreSQL pool

4. Middleware Chain
   └─► Efficient order (fast → slow)
```

---

## 🔒 Security Architecture

```
Frontend Security:
  │
  ├─► XSS Protection
  │    └─► DOMPurify sanitizes HTML
  │
  ├─► CSRF Protection
  │    └─► JWT tokens (no cookies)
  │
  └─► Input Validation
       └─► Client-side validation

Backend Security:
  │
  ├─► Password Security
  │    └─► bcrypt (cost 10)
  │
  ├─► JWT Authentication
  │    ├─► HS256 signing
  │    └─► 24-hour expiration
  │
  ├─► SQL Injection Protection
  │    └─► Parameterized queries (sqlc)
  │
  ├─► CORS
  │    └─► Configured allowed origins
  │
  └─► Panic Recovery
       └─► No information leakage
```

---

## 📈 Monitoring & Logging

```
Request ID Flow:
  │
  Browser
    │ X-Request-ID: <uuid>
    ▼
  RequestID Middleware
    │ Generate/Extract UUID
    │ Add to context
    │ Add to response header
    ▼
  Logger Middleware
    │ Log: [METHOD] IP PATH - STATUS (DURATION) BYTES
    │ Include Request ID
    ▼
  Handlers
    │ Use Request ID from context
    │ Include in error logs
    ▼
  Database Queries
    │ Include Request ID in logs
    └─► Traceable across entire request lifecycle
```

---

## 🎉 Заключение

Архитектура Eureka построена на следующих принципах:

✅ **Separation of Concerns** - четкое разделение слоев
✅ **Type Safety** - TypeScript + sqlc
✅ **Reusability** - UI Kit + Custom Hooks
✅ **Security** - Multiple layers of protection
✅ **Performance** - Optimizations at every level
✅ **Maintainability** - Clean, documented code
✅ **Scalability** - Ready for growth

---

**Версия:** 2.1
**Дата:** 22 октября 2025
