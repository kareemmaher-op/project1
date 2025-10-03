# Backend API - EpiSure Medical Case Management

A production-ready Azure Functions backend API for managing medical cases, patients, medications, and emergency contacts.

## Features

- **JWT Authentication** with Azure Entra ID (JWKS validation)
- **Rate Limiting** (per IP/user)
- **Audit Logging** for all operations
- **Comprehensive Error Handling** with custom error types
- **TypeScript Strict Mode** enabled
- **Health Check Endpoints** (liveness, readiness)
- **Soft Delete** support for all entities
- **Transaction Support** for complex operations
- **Input Validation** on all endpoints
- **Application Insights** logging (configurable)
- **Database Migrations** with TypeORM
- **Comprehensive API Documentation**

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 12.x
- Azure Functions Core Tools v4
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your database and Azure Entra ID settings in .env
```

## Configuration

Edit `.env` file with your settings:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=episure_db

# Azure Entra ID
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret

# Authentication
ALLOW_LEGACY_AUTH=true  # Set to false in production

# Application Insights (optional)
APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
```

## Running the Application

### Development

```bash
# Start the Azure Functions runtime
npm start

# Or with watch mode
npm run watch
```

The API will be available at: `http://localhost:7071/api`

### Build

```bash
# Build TypeScript
npm run build

# Clean build
npm run clean && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:int
```

## Database Migrations

### Generate Migration

```bash
npm run typeorm:generate
```

### Run Migrations

```bash
npm run typeorm:run
```

### Revert Migration

```bash
npm run typeorm:revert
```

See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) for detailed migration guide.

## API Documentation

Comprehensive API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Links

- [Authentication](#authentication)
- [Health Checks](#health-checks)
- [User Management](#user-management)
- [Case Management](#case-management)
- [Patient Management](#patient-management)
- [Medication Management](#medication-management)
- [Emergency Contacts](#emergency-contacts)
- [Notification Preferences](#notification-preferences)

### Example Request

```bash
curl -X POST http://localhost:7071/api/cases \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "CASE-12345",
    "case_name": "Patient Case"
  }'
```

## Security Features

### JWT Authentication

All endpoints (except public ones) require valid JWT tokens from Azure Entra ID:

```
Authorization: Bearer <JWT_TOKEN>
```

### Rate Limiting

Rate limits are applied per endpoint:

- User Registration: 10 req/min
- Case Creation: 50 req/min
- Default: 100 req/min

### Audit Logging

All operations are logged with:
- User ID & Email
- Action & Resource
- Timestamp
- Success/Failure
- IP Address

### Input Validation

All inputs are validated before processing:
- Email format validation
- Phone number (E.164) validation
- Date format validation
- Required field checks

## Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── config/         # Database configuration
│   │   ├── entities/       # TypeORM entities
│   │   ├── repositories/   # Data access layer
│   │   └── migrations/     # Database migrations
│   ├── functions/          # Azure Functions handlers
│   │   └── auth/          # Authentication functions
│   ├── middleware/         # Auth, rate limiting, etc.
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utilities (validation, logging, etc.)
│   └── shared/             # Shared utilities
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── .env                   # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:int
```

### Coverage

```bash
npm test
```

Coverage thresholds:
- Branches: 70%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Monitoring

### Health Check Endpoints

- **`GET /api/health`** - Overall system health
- **`GET /api/health/live`** - Liveness probe
- **`GET /api/health/ready`** - Readiness probe

### Application Insights (Optional)

To enable Application Insights:

1. Install package:
   ```bash
   npm install applicationinsights
   ```

2. Set connection string in `.env`:
   ```
   APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
   ```

3. Uncomment initialization in `src/utils/appInsights.ts`

## Deployment

### Azure Functions

```bash
# Build and deploy
npm run deploy
```

### Environment Variables

Ensure all production environment variables are set in Azure:

- Database credentials
- Azure Entra ID configuration
- Application Insights connection string
- Set `ALLOW_LEGACY_AUTH=false`

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U your_username -d episure_db
```

### Migration Issues

```bash
# Reset migrations (development only!)
npm run typeorm:revert

# Check migration status
npm run typeorm:show
```

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## Code Quality

### TypeScript Strict Mode

Enabled for maximum type safety:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

### Code Formatting

- **Indentation**: 4 spaces
- **No tabs**: All tabs converted to spaces
- **Consistent patterns**: Across all repositories and services

### Error Handling

All database operations wrapped with:
- `ErrorHandler.wrapDatabaseOperation()`
- `ErrorHandler.ensureFound()`
- Custom error types (DatabaseError, NotFoundError, ValidationError)
