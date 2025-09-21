# Episure Backend & Database Project

This project contains the backend API and database layer for the Episure medical device management system.

## 📁 Project Structure

```
backend+database/
├── backend/          # Azure Functions Backend API
├── Database/         # TypeORM Database Layer
└── README.md         # This file
```

## 🗄️ Database Setup

### Prerequisites
- PostgreSQL 12+ installed and running
- Node.js 16+ installed

### Database Configuration

The database configuration is located in `Database/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=episure_db
NODE_ENV=development
```

### Running the Database

1. **Navigate to Database directory:**
   ```bash
   cd Database
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create and setup database:**
   ```bash
   # Create database (if not exists)
   psql -h localhost -U postgres -c "CREATE DATABASE episure_db;"
   ```

4. **Run migrations:**
   ```bash
   npm run migration:run
   ```

### Database Scripts

- `npm run migration:generate` - Generate new migration from entity changes
- `npm run migration:run` - Apply pending migrations
- `npm run migration:revert` - Rollback last migration
- `npm run migration:show` - Show migration status
- `npm run schema:drop` - Drop entire database schema

## 🚀 Backend API Setup

### Prerequisites
- Node.js 16+ installed
- Azure Functions Core Tools v4
- Database must be running (see Database Setup above)

### Backend Configuration

The backend uses Azure Functions with TypeScript and connects to the PostgreSQL database.

### Running the Backend

1. **Navigate to Backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   
   Or for Azure Functions:
   ```bash
   func start
   ```

### Backend Scripts

- `npm start` - Start the development server
- `npm run build` - Build the project
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 📊 Database Schema

The database contains the following entities:

### Core Tables
- **`users`** - User accounts and authentication
- **`patients`** - Patient information linked to users
- **`cases`** - Medical device cases linked to patients
- **`medications`** - Medication records for cases
- **`emergency_contacts`** - Emergency contacts for cases
- **`invited_users`** - User invitations for case access
- **`notification_preferences`** - Notification settings

### Key Features
- **Soft Delete**: All tables support soft deletion with `deleted_at` columns
- **Relationships**: Proper foreign key relationships between entities
- **Constraints**: Data validation (e.g., spray numbers 1,2 for medications)
- **Unique Constraints**: Email uniqueness, case_id uniqueness

## ⚠️ Important: Manual User ID Setup

**CRITICAL**: You must manually add user IDs to the database before using the API endpoints.

### Why Manual User ID Setup is Required
The backend API endpoints expect a `user_id` parameter to identify which user is making the request. This user must exist in the database before API calls can be made.

### How to Add Users Manually

1. **Connect to your PostgreSQL database:**
   ```bash
   psql -h localhost -U postgres -d episure_db
   ```

2. **Insert a test user:**
   ```sql
   INSERT INTO users (first_name, last_name, email, phone_number, password_hash)
   VALUES ('John', 'Doe', 'john.doe@example.com', '+1234567890', 'hashed_password_here');
   ```

3. **Note the user_id that was created:**
   ```sql
   SELECT user_id, email FROM users WHERE email = 'john.doe@example.com';
   ```

4. **Use this user_id in your API calls:**
   ```
   GET /api/getProfile?user_id=1
   POST /api/createPatient
   {
     "user_id": 1,
     "first_name": "Jane",
     "last_name": "Smith",
     ...
   }
   ```

## 🔧 API Endpoints

The backend provides the following Azure Functions:

- `GET /api/getProfile` - Get user profile
- `POST /api/createPatient` - Create a new patient
- `POST /api/createCase` - Create a new medical case
- `POST /api/createMedication` - Create medication record
- `POST /api/createEmergencyContacts` - Add emergency contacts
- `POST /api/createNotificationPreferences` - Set notification preferences
- `POST /api/inviteMember` - Invite users to cases

## 🧪 Testing

### Database Tests
```bash
cd Database
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

## 🔒 Environment Variables

### Database (.env in Database/)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=episure_db
NODE_ENV=development
```

### Backend
The backend uses the same database connection settings and reads from environment variables or the Database configuration.

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists: `psql -h localhost -U postgres -c "\l"`

2. **Migration Errors**
   - Drop and recreate database if needed
   - Ensure all entities are properly imported in `ormconfig.ts`

3. **API Endpoint Errors**
   - Ensure user_id exists in database
   - Check CORS configuration in `host.json`
   - Verify request format matches expected schema

### Reset Everything

If you need to start completely fresh:

```bash
# Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS episure_db;"
psql -h localhost -U postgres -c "CREATE DATABASE episure_db;"

# Run migrations
cd Database
npm run migration:run

# Add test user
psql -h localhost -U postgres -d episure_db -c "
INSERT INTO users (first_name, last_name, email, phone_number, password_hash)
VALUES ('Test', 'User', 'test@example.com', '+1234567890', 'test_hash');"
```

## 📝 Development Notes

- All entities support soft deletion
- Foreign key relationships are properly configured
- CORS is enabled for cross-origin requests
- The backend includes comprehensive error handling and validation
- All API responses follow a standardized format

## 🤝 Contributing

1. Make changes to entities in `Database/entities/`
2. Generate new migration: `npm run migration:generate`
3. Test changes locally
4. Update backend services if needed
5. Run tests to ensure everything works

---

**Remember**: Always add users manually to the database before testing API endpoints!