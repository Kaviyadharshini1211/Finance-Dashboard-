# Finance Dashboard Backend

A backend API for a finance dashboard system with role-based access control, financial records management, and analytics. Built with Node.js, Express, MongoDB Atlas, and JWT authentication.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (JavaScript) |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose |
| Authentication | JWT (JSON Web Tokens) |
| Validation | Zod |
| API Docs | Swagger (OpenAPI 3.0) |
| Testing | Jest + Supertest |

---
## Demo Credentials
 
Use these to test the API instantly via Swagger (`/api-docs`) or Postman without creating your own users.
Open Deployed [https://finance-dashboard-f1uw.onrender.com/api-docs/](https://finance-dashboard-f1uw.onrender.com/api-docs/) in your browser.
 
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo1234 |
| Analyst | analyst@demo.com | demo1234 |
| Viewer | viewer@demo.com | demo1234 |
 
**How to use in Swagger:**
1. Call `POST /api/auth/login` with any credential above
2. Copy the `token` from the response
3. Click **Authorize** at the top of the Swagger page
4. Paste as `Bearer <token>`

## Project Structure

```
finance-dashboard-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB Atlas connection
│   │   └── swagger.js         # Swagger/OpenAPI config
│   ├── models/
│   │   ├── User.js            # User schema (roles, password hashing)
│   │   └── FinancialRecord.js # Record schema (soft delete, indexes)
│   ├── routes/
│   │   ├── auth.routes.js     # /api/auth
│   │   ├── user.routes.js     # /api/users
│   │   ├── record.routes.js   # /api/records
│   │   └── dashboard.routes.js# /api/dashboard
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── record.controller.js
│   ├── services/
│   │   ├── auth.service.js    # Register/login business logic
│   │   ├── user.service.js    # User management logic
│   │   ├── record.service.js  # Financial record logic
│   │   └── dashboard.service.js # Aggregation/analytics logic
│   ├── middlewares/
│   │   ├── auth.js            # JWT protect + authorize(roles) RBAC
│   │   ├── validate.js        # Zod validation middleware + schemas
│   │   ├── rateLimiter.js     # Rate limiting (global + auth routes)
│   │   └── errorHandler.js    # Global error handler
│   ├── utils/
│   │   ├── response.js        # sendSuccess / sendError helpers
│   │   └── jwt.js             # Token generation
│   └── app.js                 # App entry point
├── tests/
│   ├── helpers.js             # In-memory DB setup + test utilities
│   ├── auth.test.js           # Auth endpoint tests
│   ├── records.test.js        # Records CRUD + RBAC tests
│   └── dashboard.test.js      # Dashboard + full RBAC scenario tests
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd finance-dashboard-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/finance_dashboard
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 4. Access API Docs

Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs) in your browser.
Open Deployed [https://finance-dashboard-f1uw.onrender.com/api-docs/](https://finance-dashboard-f1uw.onrender.com/api-docs/) in your browser.


### 5. Run Tests

```bash
npm test
```

Tests use an in-memory MongoDB instance — no real database needed.

---

## Docker

### Build and run locally

```bash
# Build the image
docker build -t finance-dashboard .

# Run the container
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your_secret" \
  -e NODE_ENV="production" \
  finance-dashboard
```

The Dockerfile uses a multi-stage build based on `node:20-alpine`, runs as a non-root user for security, and includes a built-in health check at `/health`.

---

## Deployed on Render

This project is deployed on [Render](https://render.com) using Docker.

To deploy your own instance:

1. Push your code to a GitHub repository
2. Go to Render → **New** → **Web Service**
3. Connect your GitHub repo and select **Docker** as the environment
4. Add the following environment variables in Render's dashboard:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

5. Click **Deploy** — Render builds the Docker image and goes live automatically

> **MongoDB Atlas tip:** In Atlas → Network Access, add `0.0.0.0/0` to allow connections from Render's dynamic IPs.

---

## Roles & Permissions

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| Register / Login | ✅ | ✅ | ✅ |
| View financial records | ✅ | ✅ | ✅ |
| Create financial records | ❌ | ❌ | ✅ |
| Update financial records | ❌ | ❌ | ✅ |
| Delete / Restore records | ❌ | ❌ | ✅ |
| Access dashboard analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |

---

## API Reference

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login and get JWT | Public |
| GET | `/api/auth/me` | Get current user profile | Any role |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users (paginated) | Admin |
| GET | `/api/users/:id` | Get a user by ID | Admin |
| PATCH | `/api/users/:id` | Update user (role/status) | Admin / Self |
| DELETE | `/api/users/:id` | Delete a user | Admin |

### Financial Records

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/records` | List records (filter + paginate) | All roles |
| GET | `/api/records/:id` | Get a single record | All roles |
| POST | `/api/records` | Create a record | Admin |
| PATCH | `/api/records/:id` | Update a record | Admin |
| DELETE | `/api/records/:id` | Soft delete a record | Admin |
| PATCH | `/api/records/:id/restore` | Restore a deleted record | Admin |

#### Record Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `type` | string | Filter by `income` or `expense` |
| `category` | string | Filter by category |
| `startDate` | date | Filter from date (YYYY-MM-DD) |
| `endDate` | date | Filter to date (YYYY-MM-DD) |
| `search` | string | Search in notes and category |
| `sortBy` | string | Sort field: `date`, `amount`, `category` |
| `sortOrder` | string | `asc` or `desc` (default: `desc`) |

### Dashboard Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance | Analyst, Admin |
| GET | `/api/dashboard/category-breakdown` | Totals grouped by category | Analyst, Admin |
| GET | `/api/dashboard/monthly-trends` | Monthly trends (`?months=6`) | Analyst, Admin |
| GET | `/api/dashboard/weekly-trends` | Weekly trends (`?weeks=4`) | Analyst, Admin |
| GET | `/api/dashboard/recent-activity` | Latest transactions (`?limit=10`) | Analyst, Admin |

---

## Supported Categories

`salary`, `freelance`, `investment`, `business`, `food`, `transport`, `utilities`, `entertainment`, `healthcare`, `education`, `rent`, `shopping`, `other`

---

## Rate Limiting

Implemented via `express-rate-limit` to protect the API from abuse.

| Route | Limit |
|-------|-------|
| All `/api/` routes | 100 requests per 15 minutes |
| `/api/auth/login` | 10 requests per 15 minutes |
| `/api/auth/register` | 10 requests per 15 minutes |

When the limit is exceeded, the API responds with `429 Too Many Requests` and a descriptive message. Rate limiting is disabled in the test environment so it does not interfere with the test suite.

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Validation errors include field-level detail:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than 0" },
    { "field": "type", "message": "Type must be 'income' or 'expense'" }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation / bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |

---

## Design Decisions & Assumptions

### Soft Delete
Records are never permanently deleted. A `DELETE` request sets `isDeleted: true` and records a `deletedAt` timestamp. Deleted records are hidden from all queries by default via a Mongoose pre-query hook. Admins can restore them via `PATCH /records/:id/restore`.

### Role Assignment on Registration
The `role` field is accepted during registration for simplicity in development/testing. In production, this would be locked to `viewer` by default and only changed by admins post-registration.

### Shared Financial Records
All financial records are organization-wide rather than per-user. Any authenticated user can view all records. Only admins can modify them. This reflects the assignment's description of a shared finance dashboard.

### Password Security
Passwords are hashed with bcryptjs (salt rounds: 12) and never returned in API responses (`select: false` in schema).

### Token Expiry
JWT tokens expire in 7 days (configurable via `JWT_EXPIRES_IN`). No refresh token mechanism is implemented as it was not required.

### In-Memory DB for Tests
Tests run against `mongodb-memory-server` so no real database connection is needed to run the test suite.

---

## Health Check

```
GET /health
```

Returns server status, timestamp, and environment.
