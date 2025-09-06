# Overview

Snipply is a modern web-based code snippet sharing platform built as a full-stack application. It allows developers to create, edit, share, and discover HTML, CSS, and JavaScript code snippets with live preview capabilities. The platform features user authentication, social interactions (likes, views), and a browsable community of shared snippets.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for home, editor, browse, trending, login, signup, and profile
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **Code Editor**: Monaco Editor integration for syntax highlighting and code editing (HTML, CSS, JavaScript)
- **Live Preview**: Custom iframe-based preview system that renders HTML/CSS/JavaScript in real-time

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ESM modules
- **Session Management**: Express session with MemoryStore for development
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **Storage Layer**: In-memory storage implementation (`MemStorage`) with interface-based design allowing for easy database swapping
- **API Design**: RESTful API structure with endpoints for authentication, snippets, users, and social features

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in TypeScript
- **Schema Design**: Three main entities - users, snippets, and snippet_likes with proper relationships and constraints
- **Current Implementation**: In-memory storage for development with interface pattern allowing seamless migration to PostgreSQL
- **Migration System**: Drizzle Kit for database migrations and schema management

## Authentication and Authorization
- **Strategy**: Session-based authentication using express-session
- **Password Security**: bcrypt hashing with salt rounds for password storage
- **Session Storage**: MemoryStore for development (easily configurable for production stores)
- **Route Protection**: Middleware-based authentication checks for protected routes
- **User Registration**: Email and username uniqueness validation with proper error handling

## Development and Build System
- **Build Tool**: Vite with TypeScript support and React plugin
- **Development**: Hot module replacement and development server integration
- **Production Build**: Separate client and server builds with optimized bundling
- **Code Splitting**: Automatic code splitting and lazy loading support
- **Asset Management**: Vite-based asset handling with alias support for clean imports

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod validation
- **TypeScript**: Full TypeScript support across client and server
- **Node.js Runtime**: Express.js server with TypeScript execution via tsx

## UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Icons**: Lucide React for consistent iconography
- **Animation**: Class Variance Authority for component variants

## Database and ORM
- **Database Driver**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Schema Validation**: Zod schemas for runtime type checking and validation

## Development Tools
- **Code Editor**: Monaco Editor for in-browser code editing
- **Query Management**: TanStack React Query for server state
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session store
- **Password Hashing**: bcrypt for secure password storage

## Build and Development
- **Build System**: Vite with plugins for React and development enhancements
- **Development**: @replit/vite-plugin-runtime-error-modal for error handling
- **Bundling**: esbuild for server-side bundling and optimization
- **PostCSS**: Tailwind CSS processing and autoprefixer