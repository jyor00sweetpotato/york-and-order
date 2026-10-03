# York & Order - Productivity Application

## Overview

York & Order is a productivity-focused application that helps users organize tasks by urgency categories (ASAP, Today, This Week, Next Week, Eventually, Parking Lot) and type (personal/professional). The application provides task management with completion tracking, 1:1 discussion tracking with colleagues, and productivity reports with visual charts. All dropdown values (categories, types, statuses) are configurable through the Settings page.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, with custom hooks for data fetching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration including CSS variables for theming
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Charts**: Recharts for productivity visualization in reports

### Backend Architecture
- **Framework**: Express.js (v5) running on Node.js
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Storage Pattern**: Repository pattern via `IStorage` interface in `server/storage.ts`

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains table definitions using Drizzle's pgTable
- **Migrations**: Managed via `drizzle-kit push` command
- **Connection**: Uses `DATABASE_URL` environment variable for connection string

### Shared Code Architecture
- **Location**: `shared/` directory contains code used by both client and server
- **Schema**: Database models and Zod validation schemas in `shared/schema.ts`
- **API Routes**: Type-safe route definitions with input/output schemas in `shared/routes.ts`
- **Path Aliases**: `@shared/*` maps to `shared/*` for clean imports

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production Build**: Custom build script using esbuild for server bundling, Vite for client
- **Output**: Server bundle to `dist/index.cjs`, client assets to `dist/public`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage for Express sessions (available but session auth not yet implemented)

### UI Libraries
- **Radix UI**: Headless component primitives for accessible UI components
- **Lucide React**: Icon library used throughout the interface
- **Recharts**: Charting library for productivity reports

### Form Handling
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Zod resolver for form validation
- **Zod**: Schema validation shared between client and server

### Date Handling
- **date-fns**: Date formatting and manipulation utilities

## Recent Changes

### January 26, 2026 (Latest Session)
- **Task Search, Filter & Sort**: Home dashboard now has controls to find and organize tasks
  - Search input filters tasks by title and description
  - Priority filter dropdown (ASAP, Today, This Week, etc.)
  - Type filter dropdown (Personal, Professional)
  - Sort options: Urgency (high/low), Deadline (soon/later), Title (A-Z/Z-A)
  - Empty state shown when no tasks match filters
- **Discussion Item Due Dates**: Optional due date field for 1:1 discussion topics
  - Added `dueDate` column to `discussionItems` table
  - Due date picker in Add Topic dialog and on existing items
  - Visual indicators: red styling for overdue, amber for due today
  - Ability to set and clear due dates on any discussion item

### January 26, 2026
- **Deadline-Priority Validation**: Tasks must have deadlines that match their priority category
  - "Today" = deadline must be today
  - "This Week" = deadline must be before next Monday
  - "Next Week" = deadline must be between coming Monday and following Sunday
  - "Eventually" = deadline must be further out than next week
  - Validation shared utility: `shared/deadline-validation.ts`
  - Visual warning shown in create/edit forms when validation fails
  - Blocked from creating tasks that fail validation
- **Tasks To Review Queue**: Tasks that age into validation failure appear in a new "Tasks To Review" section
  - Shows on Home page above overdue tasks
  - Uses `useTasksNeedingReview()` hook to filter pending tasks
  - TodoCard displays "Needs Review" badge for these tasks
- **Edit Mode Relationship Support**: TaskDetailDialog edit mode now includes RelationshipSelector
  - Can add/remove task relationships when editing
  - Can add/remove discussion item links when editing
- **Mobile Scrolling Fix**: Added `overscroll-contain touch-pan-y` classes to scrollable areas in RelationshipSelector

### January 26, 2026
- **Task Relationships Feature**: Tasks can now be connected to other tasks and discussion items
  - Relationship types: "blocks", "blocked_by", and "associated"
  - RelationshipSelector component in task creation dialog with search functionality
  - Task cards display related tasks and linked discussion items
  - Database tables: `taskRelationships` and `taskDiscussionLinks` with cascade delete
  - Hooks: `useTaskRelationships`, `useTaskDiscussionLinks` in `client/src/hooks/use-relationships.ts`
- **Overdue Tasks Dashboard**: Home page now displays overdue tasks (deadline < now, not completed) first with warning styling, followed by other pending tasks
- **Discussion Date Stamps**: Discussion items show "Discussed [date]" when marked as discussed, using discussedAt timestamp
- **Enhanced Reports**: Complete redesign of reports page
  - Period-based tabs: This Week (Mon-Sun), This Month (since 1st), All Time
  - Statistics: Total completed, personal/professional breakdown, average completion times
  - API returns thisWeek, thisMonth, allTime stats objects with totals and averages

### January 26, 2026
- **1:1 Discussion Items System**: New feature for tracking topics to discuss in 1:1 meetings with colleagues
  - Colleagues can be added/managed in Settings
  - Discussion items have description, notes, date added, and status (To Discuss, Ongoing, Discussed)
  - When marked "Discussed", items move to an archive view with discussedAt timestamp
  - Route: `/one-on-ones`
- **Dynamic Settings System**: All dropdown values are now configurable without code changes
  - Settings page at `/settings` with tabs for Tasks and 1:1 Discussions
  - Can add/remove: task categories, task types, discussion statuses, colleagues
  - Sidebar and task forms dynamically load values from settings
- **Database Schema Updates**: Added `colleagues`, `discussion_items`, and `settings` tables

### January 25, 2026
- **Dual Categorization System**: Tasks now have both a `type` (personal/professional) and a `category` (priority: ASAP, Today, This Week, Next Week, Eventually, Parking Lot)
- **Sidebar Navigation**: Updated to show filtering by both type and priority categories
- **Routes**: Added `/type/personal`, `/type/professional`, and `/category/:category` routes for filtered views
- **Task Cards**: Display both type and priority badges with distinct color coding