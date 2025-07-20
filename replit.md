# TaskMood - AI-Powered Task Management

## Overview

TaskMood is a modern full-stack web application that combines intelligent task management with mood-based productivity insights. The system uses AI to analyze user moods and provide personalized task recommendations, creating a more intuitive and effective productivity experience. Built for students, staff, and employees, it features real-time collaboration, voice input capabilities, and comprehensive analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Real-time Communication**: WebSocket integration for live chat and updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with WebSocket support for real-time features
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Session Store**: PostgreSQL-backed session storage for authentication

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Secure HTTP-only cookies with PostgreSQL storage
- **User Roles**: Support for student, staff, and employee role-based access

### Task Management Engine
- **CRUD Operations**: Full task lifecycle management with priority levels
- **Status Tracking**: Pending, in-progress, completed, and overdue states
- **Smart Categorization**: Automatic and manual task categorization
- **Due Date Management**: Intelligent deadline tracking and notifications

### AI Integration Layer
- **Mood Analysis**: OpenAI GPT-4o integration for sentiment analysis
- **Task Suggestions**: AI-powered task prioritization based on mood and context
- **Personalized Greetings**: Dynamic AI-generated user interactions
- **Voice Processing**: Speech-to-text integration for voice commands

### Real-time Communication
- **WebSocket Server**: Live chat functionality with user presence
- **Message Broadcasting**: Real-time message delivery across connected clients
- **Connection Management**: Automatic reconnection and error handling

### Analytics Dashboard
- **Performance Metrics**: Task completion rates and productivity insights
- **Mood Tracking**: Historical mood analysis and correlation with productivity
- **Visual Reports**: Charts and graphs for data visualization

## Data Flow

### User Authentication Flow
1. User initiates login through Replit Auth
2. OpenID Connect handles authentication with secure token exchange
3. User session established with PostgreSQL-backed storage
4. Client receives authentication status and user profile data

### Task Management Flow
1. User creates/modifies tasks through React frontend
2. TanStack Query manages client-side state and caching
3. Express API validates and processes task operations
4. Drizzle ORM executes type-safe database operations
5. Real-time updates broadcast via WebSocket to connected clients

### AI Mood Analysis Flow
1. User inputs mood data through various UI components
2. Frontend sends mood data to Express API endpoint
3. Server calls OpenAI GPT-4o for sentiment analysis
4. AI response processed and stored in PostgreSQL
5. Personalized suggestions generated and returned to client

### Real-time Communication Flow
1. Client establishes WebSocket connection on authentication
2. Messages sent through WebSocket with user identification
3. Server broadcasts messages to relevant connected clients
4. Message history stored in PostgreSQL for persistence

## External Dependencies

### Core Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL hosting for scalable data storage
- **OpenAI API**: GPT-4o integration for AI-powered features
- **Replit Platform**: Development environment and deployment platform

### Frontend Libraries
- **Radix UI**: Accessible component primitives for consistent UX
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TanStack Query**: Server state management and caching
- **Lucide Icons**: Consistent iconography throughout the application

### Backend Libraries
- **Express.js**: Web application framework for API development
- **Drizzle ORM**: Type-safe database operations and migrations
- **WebSocket**: Real-time bidirectional communication
- **Passport.js**: Authentication middleware for secure login flows

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: Secure configuration for API keys and database URLs

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: esbuild compilation for Node.js deployment
- **Static Assets**: Served through Express with proper caching headers

### Environment Configuration
- **Database URL**: PostgreSQL connection string for Drizzle
- **OpenAI API**: Secure API key management for AI features
- **Session Secret**: Cryptographic secret for session security
- **Replit Auth**: OIDC configuration for authentication

The architecture prioritizes type safety, real-time capabilities, and AI-enhanced user experience while maintaining scalability and security best practices.