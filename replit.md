# MQTT Sender - Hardware Emulator

## Overview

This is a full-stack web application that emulates outboard hardware sending MQTT messages to a server. The application provides a user interface for composing and sending MQTT messages to a cloud-hosted EMQX broker, useful for testing and development of IoT systems without physical hardware.

The project follows a monorepo structure with a React frontend (Vite) and Express backend, sharing TypeScript types and validation schemas between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)

### Backend Architecture
- **Framework**: Express 5 with TypeScript
- **Runtime**: Node.js with tsx for development
- **MQTT Client**: mqtt.js library connecting to EMQX cloud broker via WebSocket Secure (WSS)
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Build**: esbuild for production bundling with selective dependency bundling

### Shared Code
- **Location**: `shared/` directory accessible via `@shared/*` path alias
- **Schema**: Drizzle ORM schemas and Zod validation schemas
- **Types**: Shared TypeScript types for MQTT messages, connection status, and message logs

### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit with `db:push` command
- **Current Storage**: In-memory storage implementation (MemStorage class) with interface ready for database migration

### Key Design Decisions

1. **Monorepo Structure**: Client, server, and shared code in single repository enables type safety across the stack and simplified deployment.

2. **MQTT over WebSocket**: Uses WSS protocol (`wss://`) to connect to EMQX cloud broker, enabling browser-compatible secure connections.

3. **Credentials via Environment**: MQTT credentials stored in `MQTT_USERNAME` and `MQTT_PASSWORD` environment variables for security.

4. **Lazy MQTT Connection**: Server establishes MQTT connection on-demand rather than at startup, with automatic reconnection handling.

5. **Zod Schema Sharing**: Validation schemas defined once in shared directory, used for both frontend form validation and backend request validation.

## External Dependencies

### MQTT Broker
- **Service**: EMQX Cloud (managed MQTT broker)
- **Endpoint**: `wss://yce1c101.ala.eu-central-1.emqxsl.com:8084/mqtt`
- **Protocol**: WebSocket Secure (WSS) on port 8084
- **Authentication**: Username/password via environment variables

### Database
- **Type**: PostgreSQL (configured via Drizzle)
- **Connection**: `DATABASE_URL` environment variable
- **Note**: Currently using in-memory storage; database connection required for production persistence

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `MQTT_USERNAME` - EMQX broker username
- `MQTT_PASSWORD` - EMQX broker password

### Key NPM Dependencies
- `mqtt` - MQTT client library for Node.js
- `drizzle-orm` / `drizzle-kit` - Database ORM and migration tools
- `@tanstack/react-query` - Server state management
- `react-hook-form` / `@hookform/resolvers` - Form handling
- `zod` / `drizzle-zod` - Schema validation
- `wouter` - Client-side routing
- Radix UI primitives - Accessible UI components