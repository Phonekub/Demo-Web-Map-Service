# Map Service

A NestJS-based authentication and location service API for map applications.

## Prerequisites

### Required Software

- **Node.js** (v24 or later) - [Download](https://nodejs.org/)
- **PNPM** (v8 or later) - Package manager
  ```sh
  ## For mac
  brew install pnpm
  # or using npm
  npm install -g pnpm
  ```
  ```sh
  ## For window
  npm install -g pnpm
  # Or use chocolatey
  choco install pnpm
  ```
- **Docker** - [Download](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0 or later) - [Installation Guide](https://docs.docker.com/compose/install/)
- **Make** - Command runner utility
  - **macOS**: Pre-installed with Xcode Command Line Tools
  - **Windows**: Install via [Chocolatey](https://chocolatey.org/) `choco install make`
  - **Linux**: Usually pre-installed, or install via package manager

## Project Structure

This is a **NestJS** application with:

- **PostgreSQL** database with **PostGIS** extensions for geospatial data
- **TypeORM** for database operations
- **JWT** authentication
- **Docker** containerization
- **PNPM** package management

## Install Dependencies

```sh
pnpm fetch && pnpm install --offline
```

or

```sh
make initial
```

## Getting Started with Docker Compose

This project uses `docker-compose` for local development and testing.

## Usage

### Quick Start with pnpm

```sh
pnpm start:dev
```

### Quick Start with Docker

1. **Build and start all services:**

   ```sh
   make dev-and-logs
   ```

   This command will:
   - Stop any running containers
   - Build and start the application and PostgreSQL database
   - Show logs from all services

2. **Access the application:**
   - API: http://localhost:3001
   - Database: localhost:5432

#### Testing

- **Run all tests:**

  ```sh
  pnpm test
  ```

- **Run tests with coverage:**

  ```sh
  pnpm test:cov
  ```

- **Run tests in watch mode:**
  ```sh
  pnpm test:watch
  ```

## Technologies Used

- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with PostGIS
- **ORM**: TypeORM
- **Authentication**: JWT, Passport
- **Testing**: Jest
- **Containerization**: Docker, Docker Compose
- **Package Manager**: PNPM
- **Linting**: ESLint, Prettier

## Project Architecture

This project follows a clean architecture pattern with:

- **Adapter Layer**: Controllers, DTOs, Guards, Mappers
- **Application Layer**: Use cases, Queries, Ports
- **Domain Layer**: Entities, Business logic
- **Infrastructure**: Database repositories, External services

# Naming Convention Standards

This document outlines the standard naming conventions to be followed across the project for consistency and clarity. Adhering to these conventions ensures better readability, maintainability, and collaboration.

## 1. Database Naming Conventions

### Table Names

- Use **snake_case** and **UPPER CASE** for table names.
- Table names should be singular.
- Avoid abbreviations unless they are widely understood.
- Prefix tables with the module or domain name if necessary to avoid ambiguity.

**Example:**

- `user`
- `order`
- `product_inventory`

### Column Names

- Use **snake_case** for column names.
- Column names should be descriptive and self-explanatory.
- Foreign key columns should reference the parent table name followed by `_id`.

**Example:**

- `id`
- `user_id`
- `created_at`
- `updated_at`

## 2. API Naming Conventions

### REST API Conventions

#### Endpoint URLs

- Use **kebab-case** for endpoint paths.
- Use plural nouns for collections.
- Use HTTP methods to define actions (GET, POST, PUT, DELETE).
- Avoid using verbs in endpoint names; actions are implied by HTTP methods.
- Use hierarchical structure for nested resources.

**Basic CRUD Operations:**

- `GET /users` - Get all users
- `GET /users/{id}` - Get specific user
- `POST /users` - Create new user
- `PUT /users/{id}` - Update entire user
- `DELETE /users/{id}` - Delete user

**Nested Resources:**

- `GET /users/{id}/orders` - Get orders for specific user
- `POST /users/{id}/orders` - Create order for specific user
- `GET /orders/{id}/items` - Get items for specific order

**Non-CRUD Operations:**

- `POST /users/{id}/activate` - Activate user account
- `POST /users/{id}/reset-password` - Reset user password
- `GET /users/{id}/profile` - Get user profile

#### Query Parameters

- Use **camelCase** for query parameters.
- Use standard parameter names for common operations.

**Common Query Parameters:**

- `page` - Page number for pagination
- `limit` - Number of items per page
- `sortBy` - Field to sort by
- `order` - Sort order (asc/desc)
- `search` - Search term
- `filter` - Filter criteria

**Example:**

- `GET /users?page=1&limit=10&sortBy=createdAt&order=desc`
- `GET /products?search=laptop&filter=category:electronics`

#### Response Format

- Use consistent JSON response structure.
- Include metadata for pagination and status information.

**Success Response:**

```json
{
  "data": [...],
  "total": 100
}
```

**Error Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## 3. Variable Naming Conventions

### General Rules

- Use **camelCase** for variable names.
- Use descriptive and meaningful names.
- Avoid single-character variable names except for loop counters.
- Use `UPPER_SNAKE_CASE` for constants.

**Example:**

- `let userName = "John";`
- `const MAX_RETRIES = 5;`
- `for (let index = 0; index < array.length; index++) { ... }`

### Boolean Variables

- Prefix boolean variables with `is`, `has`, or `can`.

**Example:**

- `let isActive = true;`
- `let hasPermission = false;`

## 4. File Naming Conventions

### Component Files

### General Rules

- Use **camelCase** for variable names.
- Use descriptive and meaningful names.

**Example:**

- `location.controller.ts`
- `searchLocation.usecase.ts`

---
