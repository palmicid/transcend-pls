*This project has been created as part of the 42 curriculum by kkaiyawo, pjerddee, pnamwayk, praungde, scharuka*

# transcend-pls

Our forever ft_transcendence project.

## Description

*clearly presents the project, including its goal and a brief overview.*
ft_transcendence is the last project in 42 common core curriculum. Its goal is to come together as a group create a web application with our inspiration. It aims to promote professional growth and collaboration.

This project also emphasizes frontend quality and user experience. A custom-made design system was created to ensure visual consistency across pages, together with reusable UI components and integrated API-driven pages such as home, login, register, main, profile, edit profile, and friends.

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

1. Clone the repository
2. Install Docker and Make
3. Run `make dev` to start the development environment, or `make prod` to start the production environment

### prerequisites

(software, tools, versions, configuration like .env setup, etc.), and step-by-step instructions to run the project.

## Resources

*classic references related to the topic (documentation, articles, tutorials, etc.), as well as a description of how AI was used - specifying for which tasks and which parts of the project.*

- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## Team Information

### kkaiyawo (Game Engine & Room Management)

- Designed and implemented core game engine logic for multiplayer gameplay
- Built room management flows (room creation, join/leave, readiness, and lifecycle handling)
- Implemented remote real-time gameplay support with reconnection handling and latency-aware synchronization
- Developed a challenging AI opponent with human-like behavior (non-perfect play) for single-player matches
- Added a second game with matchmaking, user match history, and gameplay statistics tracking

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

### scharuka (Role)

- Responsibility 1

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
- **Next.js 16** for page-based application structure and full-stack integration
- **React 19** for building reusable component-based interfaces
- **TypeScript** for type safety and maintainable frontend code
- **Tailwind CSS 4** for rapid and consistent styling
- **Lucide React** for lightweight and consistent iconography
- **Framer Motion** for smooth UI transitions and micro-interactions

### Backend
- Backend: Next.js

### Database
- Database: Postgres

### AI
- AI: Ollama
  - Ollama is a local model that we run on our machine.
- Any other significant technologies or libraries.
- Justification for major technical choices.

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
| Major | Gaming and user experience | Add another game with user history and matchmaking | 2 pts | kkaiyawo |
| Major | Web | Implement real-time features using WebSockets or similar technology. | 2 pts | kkaiyawo |

Total points from these modules: **13 points**

---

## 1. Use a Frontend Framework

**Type:** Minor
**Category:** Web
**Points:** 1

### Justification
A modern frontend framework was used to organize the UI with reusable components and maintain a scalable structure.

### Implementation
The frontend was implemented using **Next.js (React)** with **TypeScript**, **TailwindCSS**, and **Lucide React**. Next.js provides page routing (`app/` directory), component-based architecture, and seamless integration with backend APIs.

**Contributor:** pnamwayk

---

## 2. Custom-made Design System with Reusable Components

**Type:** Minor
**Category:** Web
**Points:** 1

### Justification
A custom design system was introduced to ensure UI consistency and reduce duplicated interface code across pages.

### Implementation
Defined a shared **color palette, typography rules, and icon system** (Lucide React), together with reusable UI components such as `Button`, `Card`, `Icon`, `PageHeader`, `Pagination`, `SearchInput`, `Select`, `AlertModal`, `ToastAlert`, `ProfileCard`, `ProfileHeader`, `ProfileInfoGrid`, and `EditProfileModal`.

**Contributor:** pnamwayk

---

## 3. Advanced Search Functionality

**Type:** Minor
**Category:** Web
**Points:** 1

### Justification
Advanced search improves usability when browsing user-related data such as friends.

### Implementation
Implemented **search, filtering, sorting, and optional pagination** to efficiently browse friend-related data. This functionality is mainly used in the **Friends page** to help users quickly locate and manage entries.

**Contributor:** pnamwayk

---

## 4. Introduce an AI Opponent for games.

**Type:** Major
**Category:** Artificial Intelligence
**Points:** 2

### Justification
An AI opponent expands gameplay accessibility by allowing players to practice and play even when no human opponent is available.

### Implementation
Implemented a game AI that is intentionally non-perfect to simulate human-like decision making while still being strong enough to win occasionally. The AI behavior supports configured game options so it remains compatible with customization settings.

**Contributor:** kkaiyawo

---

## 5. Implement a complete web-based game where users can play against each other.

**Type:** Major
**Category:** Gaming and user experience
**Points:** 2

### Justification
A complete multiplayer game module is central to the project objective and demonstrates full-stack gameplay engineering from room setup to match resolution.

### Implementation
Built a complete browser-based game loop with clear rules, live multiplayer turns, deterministic game state transitions, and explicit win/loss conditions.

**Contributor:** kkaiyawo

---

## 6. Remote players - Enable two players on separate computers to play the same game in real-time.

**Type:** Major
**Category:** Gaming and user experience
**Points:** 2

### Justification
Remote real-time play enables core user value for the platform and ensures the game experience works across separate machines and networks.

### Implementation
Implemented synchronized real-time gameplay for two remote users, including disconnection handling, reconnection logic, and latency-aware behavior to keep matches responsive and stable.

**Contributor:** kkaiyawo

---

## 7. Add another game with user history and matchmaking

**Type:** Major
**Category:** Gaming and user experience
**Points:** 2

### Justification
Adding another game broadens replayability and showcases scalable architecture for multi-game support with persistent player progression data.

### Implementation
Added a second distinct game mode with matchmaking capabilities, persistent match history, and user statistics tracking while maintaining performance and responsiveness.

**Contributor:** kkaiyawo

---

## 8. Implement real-time features using WebSockets or similar technology.

**Type:** Major
**Category:** Web
**Points:** 2

### Justification
Real-time communication is essential for live multiplayer gameplay, synchronized room state, and responsive cross-client user experience.

### Implementation
Implemented real-time updates using SSE (a WebSocket-like streaming technology) with room-scoped broadcasting, connection lifecycle handling, and reconnection resilience:
- Real-time updates across clients were delivered through server push streams to all connected room subscribers.
- Connection and disconnection were handled gracefully with stream cleanup, keep-alive behavior, and deferred player removal.
- Efficient message broadcasting was implemented through in-memory room-based pub/sub listener sets.

**Contributor:** kkaiyawo

## Indeividual Contributions

- Detailed breakdown of what each team member contributed.
- Specific features, modules, or components implemented by each person.
- Any challenges faced and how they were overcome.
  - Subject version change (16 --> 19)
