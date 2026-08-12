# MyProdigy: Project Structure & Architecture Guide

This document outlines the strict monorepo file structure for the MyProdigy application. AI agents and developers must adhere to these boundaries. The project uses a **Monorepo** approach, strictly dividing the Go backend, the Next.js frontend, and shared constants.

## 📁 Monorepo Root

```text
myprodigy/
├── backend/            # ONLY Go code (API & WebSockets)
├── frontend/           # ONLY Next.js / React code
├── shared/             # ONLY shared schemas, docs, and event constants
├── PROJECT_STRUCTURE.md# This file
└── DATABASE_DESIGN.md  # Database schema reference

🛠️ 1. Backend (/backend) - Go Layered Architecture

The backend strictly follows a layered architecture to keep handlers "dumb" and business logic testable. We use go-chi/chi/v5 for routing and jackc/pgx/v5 (via raw SQL or sqlc) for data access. No ORMs.
Plaintext

backend/
├── cmd/
│   └── api/
│       └── main.go                 # Entry point: wires up dependencies, starts HTTP/WS servers
├── internal/
│   ├── handlers/                   # DUMB HANDLERS: Parses HTTP/WS requests, calls Services, returns JSON
│   │   ├── auth_handler.go
│   │   ├── session_handler.go      # REST endpoints for focus sessions
│   │   └── dropoff_handler.go      # Porch drop-offs
│   ├── service/                    # BUSINESS LOGIC: Pet decay, upgrade validation, session logic
│   │   ├── session_service.go      
│   │   ├── pet_service.go          
│   │   └── house_service.go        
│   ├── repository/                 # DATABASE ACCESS: Raw SQL/sqlc only. Returns internal models.
│   │   ├── db.go                   # Postgres connection pool setup
│   │   ├── queries/                # .sql files if using sqlc
│   │   └── user_repo.go            # SQL queries for users
│   ├── models/                     # SINGLE SOURCE OF TRUTH: Go structs for DB and JSON serialization
│   │   ├── user.go
│   │   ├── partnership.go
│   │   └── event.go                
│   ├── ws/                         # WEBSOCKET HUB: In-memory state, presence, graceful disconnects
│   │   ├── hub.go                  # Manages rooms (partnerships) and active clients
│   │   └── client.go               # Handles individual WebSocket connections
│   └── middleware/                 # Middleware: JWT interception via golang-jwt/jwt/v5
│       └── auth_middleware.go
├── migrations/                     # MIGRATION DRIVEN DESIGN: Strict up/down SQL files
│   ├── 000001_init_schema.up.sql
│   └── 000001_init_schema.down.sql
├── pkg/                            # Reusable, domain-agnostic utility libraries
│   └── logger/
├── go.mod
└── go.sum

🎨 2. Frontend (/frontend) - Next.js App Router

The frontend is strictly for UI presentation and client state derivation. The backend is the absolute source of truth. UI components must be small; complex logic must be extracted into hooks.
Plaintext

frontend/
├── app/                            # NEXT.JS ROUTER (Server Components by default)
│   ├── (auth)/                     # Grouped auth routes
│   │   └── login/page.tsx
│   ├── (dashboard)/                # Grouped authenticated routes
│   │   ├── layout.tsx              # Wraps dashboard in WS Provider
│   │   ├── page.tsx                # Main game view (Home, Pet, Weather)
│   │   └── focus/page.tsx          # The Timer View
│   ├── api/auth/[...nextauth]/     # NextAuth.js v5 JWT configuration
│   │   └── route.ts
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Tailwind directives
├── components/                     # DUMB UI COMPONENTS
│   ├── ui/                         # Reusable atoms (Buttons, Inputs, Modals)
│   ├── game/                       # Visual game elements
│   │   ├── PetSprite.tsx           # Canvas/CSS sprite animator ('use client')
│   │   ├── HouseRenderer.tsx       
│   │   └── WeatherOverlay.tsx      # Renders CSS rain/snow based on city
│   └── timer/                      
│       └── SyncTimer.tsx           # Displays delta from absolute UTC end time
├── hooks/                          # LOGIC EXTRACTION (Keep components clean)
│   ├── useJointSession.ts          # Manages waiting room & sync logic
│   ├── useWebSocket.ts             # Global WS connection context
│   └── usePetState.ts              
├── lib/                            # CENTRALIZED COMMUNICATION & UTILS
│   ├── api/                        # Centralized REST fetchers (No inline fetches in UI)
│   │   └── apiClient.ts            
│   ├── websocket/                  # WS event emitters/listeners
│   │   └── wsClient.ts             
│   └── utils/                      # Helper functions (Time delta calc, Tailwind merge)
├── types/                          # SINGLE SOURCE OF TRUTH: TypeScript interfaces
│   ├── models.d.ts                 # Mirrors /backend/internal/models/
│   └── next-auth.d.ts              # Auth module augmentations
├── public/                         # STATIC ASSETS
│   └── sprites/                    # AI-generated pixel art sprite sheets
│       ├── pets/
│       └── cities/
├── tailwind.config.ts              # Strict theme enforcement (No magic hex codes)
└── package.json

🤝 3. Shared (/shared) - The Boundary

Frontend and backend must never directly import from each other. The /shared folder acts as the contract between the two.
Plaintext

shared/
├── events.json                     # NO MAGIC STRINGS: Defined WS events (e.g., "POKE_SENT", "PARTNER_JOINED")
└── config.json                     # Global game constants (e.g., waiting_room_timeout
