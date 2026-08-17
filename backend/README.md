# DAWS - Document Approval Workflow System

A PostgreSQL-based document approval workflow system with multi-stage review and approval processes, built with Prisma ORM v7.

## Features

- Multi-stage sequential approval workflows
- Document versioning and revision tracking
- Digital signature support
- Real-time notifications
- Comprehensive audit logging
- Department-based user management
- Role-based access control (Administrator/User)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **PostgreSQL**: v14 or higher (or a Supabase account)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/muskanfrehan486/DAWS.git
cd DAWS/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `backend` directory and configure your database connection:

```env
# Connect to Postgres via the transaction-mode pooler
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"

# Connect to Postgres via session-mode pooler (used for migrations)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

**For Supabase users:**
- Get your connection strings from: Project Settings → Database → Connection String
- Use the "Transaction mode" URL for `DATABASE_URL`
- Use the "Session mode" URL for `DIRECT_URL`
- Replace `[YOUR-PASSWORD]` with your actual database password

**Note:** The `DIRECT_URL` is only used during migrations and is configured in `prisma.config.ts`.

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client with your database schema types.

### 5. Run database migrations

Create and apply the initial database schema:

```bash
npm run prisma:migrate
```

When prompted, enter a descriptive name for the migration (e.g., `initial_schema`).

This will:
- Create all tables defined in `prisma/schema.prisma`
- Generate SQL migration files in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma Client

### 6. Start the development server

```bash
npm run dev
npm run dev -- --host
```

The application will start with hot-reload enabled. You should see:
```
Database connection established.
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload (using tsx) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run the production build |
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate` | Create and apply new migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Migration history (generated)
├── src/
├── lib/
│   ├── env.ts              # Environment config with validation
│   ├── errors.ts           # Error handling utilities
│   └── supabase.ts         # Supabase client (easy to swap)
├── middleware/
│   ├── auth.ts             # JWT verification middleware
│   └── errorHandler.ts     # Global error handler
├── routes/
│   ├── auth.routes.ts      # Login & refresh endpoints
│   └── users.routes.ts     # Protected user routes
└── index.ts                # Express app setup
├── prisma.config.ts          # Prisma v7 configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables (not in git)
```

## Database Schema Overview

The system includes the following core entities:

- **Users & Departments**: User management with department associations
- **Documents**: Document metadata and status tracking
- **Document Versions**: Immutable version history
- **Approval Chains**: Configurable multi-stage approval workflows
- **Approval Chain Steps**: Individual review/approval stages
- **Workflow Runs**: Execution instances for each document submission
- **Approval Actions**: Audit trail of all approval decisions
- **Notifications**: User notifications for workflow events
- **Audit Logs**: Comprehensive system activity logging

## Development Tools

### Prisma Studio

Launch an interactive database browser:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View and edit data
- Explore relationships
- Run queries

### Database Migrations

**Create a new migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Apply migrations in production:**
```bash
npx prisma migrate deploy
```

**Reset database (⚠️ deletes all data):**
```bash
npx prisma migrate reset
```

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL (v14+)
- **ORM**: Prisma v7
- **Database Adapter**: @prisma/adapter-pg
- **Environment**: dotenv
- **Dev Tools**: tsx (TypeScript execution with hot-reload)

## Authentication

This system uses **Supabase Auth** for authentication. User IDs in the application database mirror the `auth.users.id` from Supabase. There is no local authentication table.

## Next Steps

1. Implement API routes (Express, Fastify, or Hono)
2. Add authentication middleware (Supabase Auth integration)
3. Create document upload/download handlers
4. Implement workflow state machine logic
5. Build frontend interface

## Troubleshooting

### TypeScript errors with `process.env`

If you see errors about `process` not being defined:
1. Ensure `@types/node` is installed (already in devDependencies)
2. Restart your TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Migration failures

- Ensure your `DATABASE_URL` is correct and accessible
- For Supabase, make sure you're using the session-mode pooler URL
- Check that your database user has CREATE TABLE permissions

### Connection issues

- Verify your database is running
- Check firewall rules for PostgreSQL port (5432)
- For Supabase, ensure your IP is allowlisted in project settings

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on the [GitHub repository](https://github.com/muskanfrehan486/DAWS/issues).
