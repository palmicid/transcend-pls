*This project has been created as part of the 42 curriculum by kkaiyawo, pjerddee, pnamwayk, praungde, scharuka*

# transcend-pls

Our forever ft_transcendence project.

## Description

*clearly presents the project, including its goal and a brief overview.*

**ft_transcendence** is the final capstone project from the 42 Common Core curriculum. Our team created a comprehensive full-stack web application featuring real-time multiplayer gaming, AI opponents, sophisticated user progression systems, and intelligent chat capabilities.

### Core Features

**Gaming & Real-Time Multiplayer**
- Multiplayer Tic-Tac-Toe with real-time synchronization across geographically distributed players
- Server-Sent Events (SSE) infrastructure for efficient cross-client updates and game state broadcasting
- Graceful handling of network latency, disconnections, and automatic reconnection logic
- Low-latency gameplay experience suitable for competitive matches

**AI & Game Intelligence**
- Challenging AI opponent that plays human-like (non-perfect) strategy for engaging single-player experience
- Adaptive AI that respects game customization options and configurations
- Explainable AI implementation with transparent decision-making logic

**Player Progression & Engagement**
- XP-based leveling system tied to game outcomes and player performance
- Achievement tracking and badges for milestone accomplishments
- Global leaderboards for competitive ranking
- Persistent match history with detailed game statistics and opponent records
- Gamification elements including visual feedback, progress tracking, and progression mechanics

**Intelligent Chat Interface**
- Local AI chat powered by Ollama LLM integration
- Real-time streaming responses to frontend with no external API dependencies
- Error handling for model availability and request resilience

**User Experience**
- Custom-designed design system ensuring visual consistency across all pages
- Reusable component library for maintainable and scalable UI development
- Advanced search functionality with filtering, sorting, and pagination for friend management
- Seamless integration between frontend pages and backend APIs

### Project Name

`ft_transcendence`

### Key Features

- extends time remaining until being absorbed by blackhole
- upon completion, advances all team members into 42's Advanced Core Cursus
- 2-factor authentication with Google OAuth
- Chat with our in-house local model (ollama)
- Play games with your friends remotely!
- Custom-made frontend design system with reusable components
- Consistent UI across home, login, register, main, profile, edit profile, and friends pages
- Friend search interface with filtering, sorting, and optional pagination
- API-connected frontend pages for real user data and interactions

## Instruction

*any relevant information about compilation, installation, and/or execution.*

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Make** (for convenient command orchestration)
- **Git** (for version control)
- Minimum **8GB RAM** recommended for Ollama model loading in development environments

### Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd transcendence/ft_transcendence
   ```

2. Start the development environment:
   ```bash
   make all              # Starts web server, database, and Ollama AI model
   make all-no-ollama    # Starts web server and database without AI (faster)
   ```

3. Access the application:
   - Web interface: `https://localhost:8443` (development) or `https://localhost:8443` (production)
   - Database admin (Prisma Studio): `npm run db:studio`
   - Run tests: `npm test`

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:
- Database connection string (PostgreSQL)
- OAuth credentials (Google 2FA)
- Ollama API endpoint (for local AI models)
- MinIO credentials (for file storage)
- Session secrets and API keys

### Other Useful Commands

```bash
make prod             # Production environment with Ollama
make prod-no-ollama   # Production without AI
make stop             # Stop all containers
make clean            # Remove all containers and volumes
make logs             # View real-time logs
npm run lint:fix      # Auto-fix linting issues
npm test:watch        # Run tests in watch mode
```

## Resources

*classic references related to the topic (documentation, articles, tutorials, etc.), as well as a description of how AI was used - specifying for which tasks and which parts of the project*

### Frontend & UI Development
- [MDN Web Docs](https://developer.mozilla.org/en-US/) — Web standards and API reference
- [Next.js Documentation](https://nextjs.org/docs) — Full-stack React framework with SSR and API routes
- [React Documentation](https://react.dev/) — UI component library and hooks
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) — Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) — Lightweight icon library
- [Framer Motion Documentation](https://www.framer.com/motion/) — Animation library for React
- [HeroUI React](https://heroui.com/) — Component library for OTP and form inputs

### Backend & Real-Time
- [Prisma Documentation](https://www.prisma.io/docs/) — Type-safe ORM for PostgreSQL
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) — Real-time server push technology
- [NextAuth.js Documentation](https://next-auth.js.org/) — Authentication solution for Next.js
- [Pino Logger](https://getpino.io/) — Fast JSON logger for structured logging

### AI & Machine Learning
- [Ollama Documentation](https://github.com/ollama/ollama) — Local LLM inference engine with Docker support
- [Common AI Model Strategies](https://en.wikipedia.org/wiki/Minimax) — Game AI decision-making algorithms

### DevOps & Infrastructure
- [Docker Documentation](https://docs.docker.com/) — Containerization and orchestration
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) — Database system
- [MinIO Documentation](https://min.io/docs/) — S3-compatible object storage
- [Nginx Documentation](https://nginx.org/docs/) — Reverse proxy and HTTPS termination

### Testing & Quality Assurance
- [Vitest Documentation](https://vitest.dev/) — Unit testing framework for JavaScript
- [ESLint Documentation](https://eslint.org/docs/) — Code quality and linting

### How AI Was Used

**Ollama LLM Integration (Chat Feature)**
- Provides a local, privacy-respecting AI chat interface powered by Ollama running in a Docker container
- Enables real-time streaming of AI responses to the frontend without external API dependencies
- Integrated for tasks: conversational chat interface, message history management, and error handling
- Implemented by **scharuka**

**Game AI Opponent**
- Uses minimax-based decision trees with configurable depth to make strategic game moves
- Implements intentional decision variation to simulate human-like (non-perfect) play
- Adapted to respect game customization options and maintain challenge balance
- Implemented by **kkaiyawo**

## Team Information

### kkaiyawo (Game Engine, Real-Time Architecture & Player Progression)

**Game Engine & Multiplayer Framework**
- Architected and implemented core multiplayer game engine supporting turn-based gameplay
- Designed abstract interfaces for extensible game implementations
- Built Tic-Tac-Toe game with complete rule logic, win/loss conditions, and draw detection
- Implemented room management system with creation, joining, readiness tracking, and lifecycle orchestration

**Real-Time Features & Server-Sent Events (SSE)**
- Designed and implemented SSE-based real-time communication replacing traditional WebSocket complexity
- Built room-scoped broadcaster with in-memory pub/sub for efficient message routing
- Implemented graceful connection lifecycle management with keep-alive heartbeats and reconnection grace periods
- Optimized message broadcasting for low-latency state synchronization across multiple concurrent players

**Remote Player Support & Network Resilience**
- Implemented synchronization protocols handling network latency and temporary disconnections gracefully
- Built reconnection logic with session restoration to preserve ongoing matches during network interruptions
- Developed state reconciliation to ensure consistent game state across geographically distributed clients

**AI Opponent System**
- Developed non-perfect AI with human-like decision-making using strategic but fallible move selection
- Implemented configurable AI difficulty and move variance for balanced competitive play
- Built AI system to adapt to game customization options while maintaining explainability for evaluation

**Player Progression & Game Statistics**
- Implemented XP-based level progression system with persistent database tracking
- Built match history system recording wins, losses, rankings, and opponent information
- Developed achievement and badge system for milestone recognition
- Created global leaderboards indexed on cumulative XP for competitive ranking
- Integrated gamification mechanics including visual feedback, progress bars, and progression rewards

### pjerddee (Role)

- Responsibility 1

### pnamwayk (Frontend Developer)

- Designed and implemented the frontend architecture for several user-facing pages
- Created a custom-made design system including color palette, typography, icon usage, and reusable UI components
- Built and styled the home, login, register, main, profile, edit profile, and friends pages
- Integrated frontend pages with APIs for dynamic data fetching and user interaction
- Implemented advanced search functionality for the friends page, including filters, sorting, and pagination support

### pruangde (Role)

- Responsibility 1

### scharuka (DevOps & AI Integration)

- Set up the initial project infrastructure and development environment
- Designed and implemented the Docker-based architecture for the project
- Configured containerized services and orchestration using Docker and Make
- Implemented HTTPS support for the application to ensure secure communication
- Integrated an AI chat feature powered by a local Ollama model
- Developed backend logic to communicate with the Ollama model and stream responses to the frontend
- Ensured the system could run consistently in both development and production environments

## Project Management

- How the team organized the work (task distribution, meetings, etc.).
  - We organized weekly meetings in Discord to update our progress from the last meeting, and plan for the next week.
  - Main features were assigned to each member based on their expertise, and we discussed the implementation plan in the meeting.
- Tools used for project management (GitHub Issues, Trello, etc.).
  - We used GitHub to host our repository and manage our code.
- Communication channels used (**Discord**, Slack, etc.).
  - We used Discord Server to communicate with each other.

## Technical Stack

### Frontend
- **Next.js 16** — Full-stack React framework with SSR, API routes, and streaming support
- **React 19** — Component-based UI library with latest hooks and server component features
- **TypeScript 5** — Static type checking for safer, self-documenting code
- **Tailwind CSS 4** — Utility-first CSS for rapid and consistent styling
- **Lucide React** — Lightweight SVG icon library with extensive icon set
- **Framer Motion** — Declarative animation library for smooth interactions
- **HeroUI React** — Component library for OTP verification and form inputs
- **date-fns** — Date manipulation and formatting utilities

### Backend & Server
- **Next.js API Routes** — Serverless backend functions deployed alongside frontend
- **Next-Auth.js 5** — Authentication and OAuth integration (Google 2FA support)
- **Prisma 7** with **@prisma/adapter-pg** — Type-safe ORM with PostgreSQL adapter
- **Pino** — Structured JSON logging with performance optimization
- **Zod** — TypeScript-first schema validation for type-safe APIs
- **bcryptjs** — Cryptographic hashing for password security
- **jose** — JWT token creation and verification
- **otplib** — One-time password generation for 2FA
- **qrcode** — QR code generation for OAuth setup

### Database
- **PostgreSQL 13+** — Relational database for persistent data storage
- Prisma migrations for schema versioning and type safety
- Optimized indexes for leaderboard queries and game history lookups

### Real-Time Communication
- **Server-Sent Events (SSE)** — Efficient server-to-client streaming for game state and room updates
- In-memory pub/sub broadcaster for room-scoped message routing
- Keep-alive heartbeats for connection stability and automatic reconnection

### AI & LLM
- **Ollama** — Local LLM inference engine running in Docker container
- Streaming API responses for real-time chat experience
- No external API dependencies for privacy and cost efficiency

### Storage & DevOps
- **MinIO** — S3-compatible object storage for file uploads
- **Docker + Docker Compose** — Containerization and multi-service orchestration
- **Nginx** — Reverse proxy, HTTPS termination, and load balancing
- **Make** — Command orchestration for development and production workflows

### Testing & Quality
- **Vitest 4** — Unit testing framework with coverage reporting
- **ESLint 9** — Code linting and style consistency
- **TypeScript Compiler** — Type checking without code generation

## Database Schema

![Database Schema](https://dbdiagram.io/d/ft_transcendence-690b5d506735e1117062d060)

- Visual representation or description of the database structure.
- Tables/collections and their relationships.
- Key fields and data types.

## Feature List

- Complete list of implemented features.
- Which team member(s) worked on each feature.
- Brief description of each feature’s functionality.

### Frontend Design System
- Built a custom-made design system for the application
- Defined a consistent color palette, typography scale, and icon usage
- Created reusable UI components to improve maintainability and consistency
- Implemented by **pnamwayk**

### User Interface Pages
- Designed and implemented the UI for:
  - Home page
  - Login page
  - Register page
  - Main page
  - Profile page
  - Edit profile modal/page
  - Friends page
- Implemented by **pnamwayk**

### Frontend API Integration
- Connected frontend pages to backend APIs for real-time data rendering and interaction
- Ensured page UI matched dynamic API responses and user actions
- Implemented by **pnamwayk**

### Advanced Search for Friends
- Implemented advanced search functionality for the friends page
- Included keyword search, filtering, sorting, and optional pagination
- Focused on usability for browsing and managing friend-related data
- Implemented by **pnamwayk**

### Introduce an AI Opponent for games.
- Introduced an AI opponent that can challenge users and win occasionally
- Implemented non-perfect, human-like behavior to avoid unrealistic perfect play
- Integrated AI logic with available game customization options
- Prepared the AI system design to be explainable during project evaluation
- Implemented by **kkaiyawo**

### Implement a complete web-based game where users can play against each other.
- Implemented a complete browser-based multiplayer game experience
- Defined clear gameplay rules, turn flow, and explicit win/loss conditions
- Enabled live matches between players through real-time state updates
- Implemented by **kkaiyawo**

### Remote players - Enable two players on separate computers to play the same game in real-time.
- Enabled two players on separate computers to play the same match in real time
- Added resilience for latency and temporary disconnections
- Implemented reconnection logic to restore interrupted sessions smoothly
- Focused on responsive and stable remote gameplay UX
- Implemented by **kkaiyawo**

### Add another game with user history and matchmaking
- Implemented a second distinct game mode in addition to the primary game
- Built matchmaking flows to pair players into suitable live matches
- Tracked user game history and performance statistics
- Maintained strong runtime responsiveness for game and room operations
- Implemented by **kkaiyawo**

### Implement real-time features using WebSockets or similar technology.
- Implemented real-time cross-client updates using Server-Sent Events (SSE) as WebSocket-like streaming transport
- Broadcasted game state changes efficiently to all subscribers in the same room
- Added graceful connection/disconnection handling with cleanup and reconnection behavior
- Implemented delayed player eviction and reconnection grace logic to preserve gameplay continuity
- Implemented by **kkaiyawo**

### Implement a complete LLM system interface
- Communication between the application backend and the Ollama API
- Streaming responses from the model to the user interface
- Error handling for model availability and request failures
- Local AI inference without external API dependencies

### Game Statistics and Match History (User Management)
- Track user game statistics (wins, losses, ranking, level, etc.).
- Display match history (1v1 games, dates, results, opponents).
- Show achievements and progression.
- Leaderboard integration.
- Implemented by **kkaiyawo**

### Gamification System (Gaming and User Experience)
- Implement at least 3 of the following: achievements, badges, leaderboards, XP/level system, daily challenges, rewards.
- System must be persistent (stored in database).
- Visual feedback for users (notifications, progress bars, etc.).
- Clear rules and progression mechanics.
- Implemented by **kkaiyawo**

## Module

- List of all chosen modules (Major and Minor).
- Point calculation (Major = 2pts, Minor = 1pt).
- Justification for each module choice, especially for custom "Modules of choice".
- How each module was implemented.
- Which team member(s) worked on each module.

### Selected Modules

| Type | Category | Module | Points | Contributor |
|-----|-----|-----|-----|-----|
| Minor | Web | Use a frontend framework (React / Next.js) | 1 pt | pnamwayk |
| Minor | Web | Custom-made design system with reusable components | 1 pt | pnamwayk |
| Minor | Web | Advanced search functionality (filters, sorting, pagination) | 1 pt | pnamwayk |
| Major | Artificial Intelligence | Introduce an AI Opponent for games. | 2 pts | kkaiyawo |
| Major | Gaming and user experience | Implement a complete web-based game where users can play against each other. | 2 pts | kkaiyawo |
| Major | Gaming and user experience | Remote players - Enable two players on separate computers to play the same game in real-time. | 2 pts | kkaiyawo |
| Major | Web | Implement real-time features using WebSockets or similar technology. | 2 pts | kkaiyawo |
| Major | Artificial Intelligence | Implement a complete LLM system interface (AI Chat using Ollama) | 2 pts | scharuka |
| Minor | User Management | Game statistics and match history | 1 pt | kkaiyawo |
| Minor | Gaming and user experience | A gamification system to reward users for their actions. | 1 pt | kkaiyawo |

Total points from these modules: **16 points**

---

### 1. Use a Frontend Framework

**Type:** Minor
**Category:** Web
**Points:** 1

#### Justification
A modern frontend framework was used to organize the UI with reusable components and maintain a scalable structure.

#### Implementation
The frontend was implemented using **Next.js (React)** with **TypeScript**, **TailwindCSS**, and **Lucide React**. Next.js provides page routing (`app/` directory), component-based architecture, and seamless integration with backend APIs.

**Contributor:** pnamwayk

---

### 2. Custom-made Design System with Reusable Components

**Type:** Minor
**Category:** Web
**Points:** 1

#### Justification
A custom design system was introduced to ensure UI consistency and reduce duplicated interface code across pages.

#### Implementation
Defined a shared **color palette, typography rules, and icon system** (Lucide React), together with reusable UI components such as `Button`, `Card`, `Icon`, `PageHeader`, `Pagination`, `SearchInput`, `Select`, `AlertModal`, `ToastAlert`, `ProfileCard`, `ProfileHeader`, `ProfileInfoGrid`, and `EditProfileModal`.

**Contributor:** pnamwayk

---

### 3. Advanced Search Functionality

**Type:** Minor
**Category:** Web
**Points:** 1

#### Justification
Advanced search improves usability when browsing user-related data such as friends.

#### Implementation
Implemented **search, filtering, sorting, and optional pagination** to efficiently browse friend-related data. This functionality is mainly used in the **Friends page** to help users quickly locate and manage entries.

**Contributor:** pnamwayk

---

### 4. Introduce an AI Opponent for games.

**Type:** Major
**Category:** Artificial Intelligence
**Points:** 2

#### Justification
An AI opponent expands gameplay accessibility by allowing players to practice and play even when no human opponent is available.

#### Implementation
Implemented a challenging yet beatable game AI with the following characteristics:
- **AI must be challenging and able to win occasionally:** The AI implements strategic decision-making while maintaining competitive difficulty
- **Simulate human-like behavior:** AI intentionally makes non-perfect plays to avoid unrealistic dominance, creating engaging matches
- **Support game customization:** The AI adapts to configured game options and rules, remaining compatible with all game variations
- **Explainable AI:** Implementation is designed to be clearly explained and evaluated, with transparent decision-making logic

The AI system is built to be robust across different game configurations and difficulty levels.

**Contributor:** kkaiyawo

---

### 5. Implement a complete web-based game where users can play against each other.

**Type:** Major
**Category:** Gaming and user experience
**Points:** 2

#### Justification
A complete multiplayer game module is central to the project objective and demonstrates full-stack gameplay engineering from room setup to match resolution.

#### Implementation
Built a complete browser-based game loop with clear rules, live multiplayer turns, deterministic game state transitions, and explicit win/loss conditions.

Key requirements met:
- The game is real-time multiplayer (Tic-Tac-Toe)
- Players are able to play live matches
- The game has clear rules and win/loss conditions
- The game is 2D with browser-based rendering

**Contributor:** kkaiyawo

---

### 6. Remote players - Enable two players on separate computers to play the same game in real-time.

**Type:** Major
**Category:** Gaming and user experience
**Points:** 2

#### Justification
Remote real-time play enables core user value for the platform and ensures the game experience works across separate machines and networks.

#### Implementation
Implemented synchronized real-time gameplay for two remote users with robust network handling:
- Handle network latency and disconnections gracefully
- Provide a smooth user experience for remote gameplay
- Implement reconnection logic to restore interrupted sessions

The system includes latency-aware state synchronization, graceful disconnection handling, and automatic reconnection to keep matches responsive and stable.

**Contributor:** kkaiyawo

---

### 7. Implement real-time features using WebSockets or similar technology.

**Type:** Major
**Category:** Web
**Points:** 2

#### Justification
Real-time communication is essential for live multiplayer gameplay, synchronized room state, and responsive cross-client user experience.

#### Implementation
Implemented real-time updates using SSE (a WebSocket-like streaming technology) with room-scoped broadcasting, connection lifecycle handling, and reconnection resilience:
- **Real-time updates across clients:** Server push streams deliver state changes to all connected room subscribers with low latency
- **Handle connection/disconnection gracefully:** Stream cleanup, keep-alive behavior, and deferred player removal ensure stable connections
- **Efficient message broadcasting:** In-memory room-based pub/sub listener sets optimize performance for multiple concurrent players

**Contributor:** kkaiyawo

### 8. Implement a complete LLM system interface

**Type:** Major
**Category:** Artificial Intelligence
**Points:** 2

#### Justification
An AI-powered chat feature was integrated to allow users to interact with a locally hosted large language model. This improves the user experience and demonstrates integration of modern AI systems into a web application.

#### Implementation
A chat interface was implemented where users can send messages to a backend endpoint. The backend communicates with a locally running **Ollama** model, processes the user input, and streams the model response back to the frontend.

The system includes:
- Communication between the application backend and the Ollama API
- Streaming responses from the model to the user interface
- Error handling for model availability and request failures
- Local AI inference without external API dependencies

**Contributor:** scharuka

---

### 9. Game statistics and match history

**Type:** Minor
**Category:** User Management
**Points:** 1

#### Justification
Tracking statistics, match history, and providing leaderboards improves user engagement and encourages competitive play.

#### Implementation
Implemented persistent tracking of user game statistics and match history:
- **Track user game statistics:** Wins, losses, ranking, level, and other performance metrics
- **Display match history:** 1v1 games with dates, results, and opponent information
- **Show achievements and progression:** Visual representation of user milestones and advancement
- **Leaderboard integration:** Global rankings to encourage competitive play

**Contributor:** kkaiyawo

---

### 10. A gamification system to reward users for their actions

**Type:** Minor
**Category:** Gaming and user experience
**Points:** 1

#### Justification
Rewards and gamification significantly increase user retention and satisfaction by giving them tangible goals.

#### Implementation
Implemented a comprehensive gamification system with multiple reward mechanisms:
- **Features:** At least 3 of the following implemented: achievements, badges, leaderboards, XP/level system, daily challenges, rewards
- **Persistence:** System is stored in database for persistent user progression
- **Visual feedback:** Notifications, progress bars, and achievement displays provide immediate user feedback
- **Clear mechanics:** Well-defined rules and progression mechanics encourage continued engagement

**Contributor:** kkaiyawo

## Individual Contributions

### kkaiyawo — Game Engine & Real-Time Architecture (10 Module Points)

**Modules Implemented:**
- Introduce an AI Opponent for games (Major, AI, 2 pts)
- Implement a complete web-based game (Major, Gaming & UX, 2 pts)
- Remote players real-time gameplay (Major, Gaming & UX, 2 pts)
- Implement real-time features using SSE (Major, Web, 2 pts)
- Game statistics and match history (Minor, User Management, 1 pt)
- A gamification system (Minor, Gaming & UX, 1 pt)

**Key Contributions:**
- Designed the abstract game engine architecture with extensible interfaces for multi-game support
- Implemented Tic-Tac-Toe game engine with complete rule logic and AI opponent with fallible decision-making
- Built the room management system handling creation, joining, readiness, and graceful lifecycle
- Architected SSE-based real-time communication with room-scoped pub/sub broadcasting
- Implemented network-resilient gameplay with latency handling, disconnection recovery, and reconnection logic
- Developed XP/level progression system with leaderboard rankings and achievement tracking
- Created comprehensive test suite covering game logic, AI behavior, room management, and SSE broadcasting
- Built gamification infrastructure with persistent progression and visual feedback mechanisms

**Challenges Overcome:**
- Designing a maintainable real-time system that gracefully handles network instability and player disconnections
- Implementing AI that appears human-like while remaining strategic and configurable
- Ensuring low-latency state synchronization across geographically distributed clients

### pnamwayk — Frontend Architecture & Design System (3 Module Points)

**Modules Implemented:**
- Use a frontend framework (Minor, Web, 1 pt)
- Custom-made design system with reusable components (Minor, Web, 1 pt)
- Advanced search functionality (Minor, Web, 1 pt)

**Key Contributions:**
- Architected frontend using Next.js 16 with TypeScript for type safety and maintainability
- Created custom design system with consistent color palette, typography scale, and component library
- Built reusable UI components including Button, Card, ProfileCard, SearchInput, AlertModal, and more
- Designed and implemented all frontend pages: home, login, register, main, profile, friends
- Integrated frontend pages with backend APIs for real-time data rendering and user interactions
- Implemented advanced friend search with filtering, sorting, and pagination functionality
- Ensured visual consistency and accessibility across all user-facing interfaces

### scharuka — DevOps & AI Integration (2 Module Points)

**Modules Implemented:**
- Implement a complete LLM system interface (Major, AI, 2 pts)

**Key Contributions:**
- Set up Docker-based development environment with multi-container orchestration
- Configured PostgreSQL, Ollama, MinIO, and Nginx services in Docker Compose
- Implemented Ollama LLM integration for AI-powered chat feature with streaming responses
- Built backend logic for model communication and error handling
- Established HTTPS support with Nginx reverse proxy and certificate management
- Created comprehensive deployment scripts and Make targets for dev/prod environments
- Implemented structured logging using Pino for system visibility and debugging

### pjerddee & praungde — Supporting Contributors

- Contributed to team discussions, code reviews, and debugging efforts
- Assisted with Docker configuration and environment setup
- Participated in weekly planning and progress updates

### Technical Challenges Overcome by the Team

1. **Full-Stack Integration:** Unified frontend React components, Next.js API routes, Prisma ORM, and PostgreSQL into a cohesive type-safe system

2. **Container Orchestration:** Managed multiple services (Next.js, PostgreSQL, Ollama, Nginx) with proper networking, persistence, and startup sequencing

### Development Practices

- Regularly Discord meetings for progress updates and feature planning
- GitHub for source control and code collaboration
- Next.js framework for full-stack type safety and unified deployment
- Comprehensive test suite with Vitest for game logic, AI, rooms, and SSE
- ESLint and TypeScript for code quality and consistency
- Docker Compose for reproducible development and production environments
