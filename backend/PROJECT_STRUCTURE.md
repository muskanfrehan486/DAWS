# Project Structure

This document explains the architecture and organization of the DAWS backend.

## Directory Structure

```
src/
├── lib/                    # Core utilities and clients
│   ├── env.ts             # Environment configuration
│   ├── errors.ts          # Error handling utilities
│   └── supabase.ts        # Supabase client setup
│
├── middleware/            # Express middleware
│   ├── auth.ts           # Authentication middleware
│   ├── errorHandler.ts   # Global error handler
│   └── validate.ts       # Request validation middleware
│
├── routes/               # API route definitions
│   ├── auth.routes.ts   # Authentication endpoints
│   └── users.routes.ts  # User endpoints
│
├── schemas/             # Zod validation schemas
│   ├── auth.schema.ts  # Auth-related schemas
│   └── user.schema.ts  # User-related schemas
│
├── services/           # Business logic layer
│   └── auth.service.ts # Authentication service
│
├── utils/             # Helper functions
│   └── asyncHandler.ts # Async route handler wrapper
│
├── generated/        # Auto-generated code (Prisma)
│   └── prisma/      # Prisma client
│
├── prisma.ts        # Prisma client instance
└── index.ts         # Express app entry point
```

## Architecture Layers

### 1. Routes Layer
**Purpose**: Define HTTP endpoints and orchestrate middleware

```typescript
router.post(
  '/sign-up',
  validate(signUpSchema),      // Validation middleware
  asyncHandler(async (req, res) => {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  })
);
```

**Responsibilities**:
- Define HTTP methods and paths
- Apply middleware (auth, validation)
- Call service methods
- Send HTTP responses
- NO business logic here

### 2. Services Layer
**Purpose**: Contain all business logic

```typescript
class AuthService {
  async signUp(input: SignUpInput) {
    // Validate department exists
    // Create user in Supabase
    // Create user in database
    // Handle rollback on error
    return result;
  }
}
```

**Responsibilities**:
- Business logic and workflows
- Database operations (via Prisma)
- External API calls
- Data transformation
- Transaction management

### 3. Schemas Layer
**Purpose**: Define and validate data structures

```typescript
export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    departmentId: z.string().uuid(),
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>["body"];
```

**Responsibilities**:
- Input validation rules
- Type definitions (TypeScript types)
- Documentation of expected data

### 4. Middleware Layer
**Purpose**: Process requests before they reach routes

```typescript
export async function authenticate(req, res, next) {
  // Extract token
  // Verify token
  // Attach user info to request
  // Call next() or throw error
}
```

**Responsibilities**:
- Authentication
- Validation
- Error handling
- Request transformation

### 5. Utils Layer
**Purpose**: Reusable helper functions

```typescript
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

**Responsibilities**:
- Utility functions
- Wrappers and decorators
- Common helpers

## Data Flow

```
Request
  ↓
Middleware (auth, validation)
  ↓
Route Handler
  ↓
Service (business logic)
  ↓
Database (Prisma)
  ↓
Response
```

## Example: Adding a New Feature

Let's add a "Create Document" feature:

### 1. Create Schema
**`schemas/document.schema.ts`**
```typescript
import { z } from "zod";

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(500),
    description: z.string().optional(),
  }),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>["body"];
```

### 2. Create Service
**`services/document.service.ts`**
```typescript
import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { CreateDocumentInput } from "../schemas/document.schema";

class DocumentService {
  async create(userId: string, input: CreateDocumentInput) {
    const document = await prisma.document.create({
      data: {
        title: input.title,
        description: input.description,
        preparerId: userId,
        status: "DRAFT",
      },
    });

    return document;
  }

  async getById(userId: string, documentId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        preparerId: userId,
      },
    });

    if (!document) {
      throw errors.notFound("Document not found");
    }

    return document;
  }
}

export const documentService = new DocumentService();
```

### 3. Create Routes
**`routes/document.routes.ts`**
```typescript
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { documentService } from "../services/document.service";
import { createDocumentSchema } from "../schemas/document.schema";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createDocumentSchema),
  asyncHandler(async (req, res) => {
    const result = await documentService.create(
      req.supabaseUserId!,
      req.body
    );
    res.status(201).json(result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await documentService.getById(
      req.supabaseUserId!,
      req.params.id
    );
    res.json(result);
  })
);

export default router;
```

### 4. Register Routes
**`index.ts`**
```typescript
import documentRoutes from "./routes/document.routes";

app.use("/api/documents", documentRoutes);
```

## Best Practices

### ✅ DO

1. **Keep routes thin**
   ```typescript
   // Good
   router.post('/users', validate(schema), asyncHandler(async (req, res) => {
     const result = await userService.create(req.body);
     res.status(201).json(result);
   }));
   ```

2. **Put business logic in services**
   ```typescript
   // Good - in service
   async create(input: CreateUserInput) {
     // Validate
     // Create
     // Send email
     // Return result
   }
   ```

3. **Use TypeScript types from schemas**
   ```typescript
   export type SignUpInput = z.infer<typeof signUpSchema>["body"];
   
   async signUp(input: SignUpInput) { ... }
   ```

4. **Handle errors consistently**
   ```typescript
   if (!user) {
     throw errors.notFound("User not found");
   }
   ```

5. **Always use asyncHandler**
   ```typescript
   router.get('/users', asyncHandler(async (req, res) => {
     // Errors automatically caught and passed to error handler
   }));
   ```

### ❌ DON'T

1. **Don't put business logic in routes**
   ```typescript
   // Bad
   router.post('/users', async (req, res) => {
     const user = await prisma.user.create(...);
     await sendEmail(user.email);
     await createAuditLog(...);
     res.json(user);
   });
   ```

2. **Don't access database directly in routes**
   ```typescript
   // Bad
   router.get('/users/:id', async (req, res) => {
     const user = await prisma.user.findUnique(...);
     res.json(user);
   });
   ```

3. **Don't skip validation**
   ```typescript
   // Bad
   router.post('/users', async (req, res) => {
     const result = await userService.create(req.body);
     res.json(result);
   });
   
   // Good
   router.post('/users', validate(createUserSchema), asyncHandler(...));
   ```

4. **Don't forget asyncHandler**
   ```typescript
   // Bad - errors won't be caught
   router.get('/users', async (req, res) => {
     const users = await userService.getAll();
     res.json(users);
   });
   
   // Good
   router.get('/users', asyncHandler(async (req, res) => {
     const users = await userService.getAll();
     res.json(users);
   }));
   ```

## Testing Guide

### Unit Tests (Services)
```typescript
describe('AuthService', () => {
  it('should create a new user', async () => {
    const input = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      departmentId: 'uuid',
    };
    
    const result = await authService.signUp(input);
    
    expect(result.user.email).toBe(input.email);
  });
});
```

### Integration Tests (Routes)
```typescript
describe('POST /api/auth/sign-up', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/sign-up')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        departmentId: 'uuid',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

## Error Handling

All errors flow through the global error handler:

```typescript
// Throw custom errors in services
throw errors.notFound("User not found");
throw errors.unauthorized("Invalid credentials");
throw errors.badRequest("Invalid input");

// They're caught by asyncHandler and passed to errorHandler
app.use(errorHandler);
```

## Summary

- **Routes**: HTTP layer, orchestrate middleware and services
- **Services**: Business logic, database operations
- **Schemas**: Data validation and types
- **Middleware**: Cross-cutting concerns (auth, validation, errors)
- **Utils**: Reusable helpers

This structure keeps code organized, testable, and maintainable!
