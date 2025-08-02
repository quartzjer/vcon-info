# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vCon Info is a static single-page application (SPA) developer tool for vCon standards - similar to JWT.io for OAUTH/JOSE. It allows developers to decode, inspect, and validate vCon (Virtual Conversation) data structures with support for unsigned, JWS signed, and JWE encrypted formats.

## Development Commands

**Important**: This project uses Bun as the JavaScript runtime and package manager. Always use `bun` commands instead of `npm` or `yarn`.

### Primary Commands
- `bun dev` - Start development server on http://localhost:3000 with hot reload
- `bun run build` - Build production bundle to `./dist`
- `bun run preview` - Preview production build locally
- `bun install` - Install dependencies

### Testing Commands
- `bun test` - Run tests in watch mode (recommended for development)
- `bun test:run` - Run tests once (CI mode)
- `bun test:coverage` - Generate HTML coverage report
- `bun test:ui` - Open interactive test UI in browser

### Deployment
- `bun run deploy` - Build and deploy to GitHub Pages
- Automatic deployment via GitHub Actions on push to main branch

## Technology Stack

- **Frontend**: React 18 with functional components and hooks
- **Build Tool**: Vite with fast HMR and optimized builds
- **Styling**: Tailwind CSS utility-first framework
- **Icons**: Lucide React icon library
- **Testing**: Vitest + React Testing Library + Happy DOM
- **Package Manager**: Bun (fast JavaScript runtime)

## Architecture Overview

### Core State Management
The application uses a centralized custom hook pattern:
- `useVconState.js` - Main state hook managing all application state including input, validation, UI state, and cryptographic operations
- State flows from this hook to all UI components via props

### Component Structure
- `VConInspector.jsx` - Root orchestrating component
- `InputPane.jsx` - JSON input textarea with validation
- `InspectorPane.jsx` - Tabbed interface (Inspector/Timeline/Raw views)
- `ValidationStatusBar.jsx` - Real-time validation feedback
- Specialized components: `TreeNode.jsx`, `PartyLink.jsx`, `TimelineView.jsx`

### Data Flow
1. User input → `useVconState` hook
2. Automatic validation via `vconValidator.js` utilities
3. State updates trigger UI re-renders
4. Interactive components (tree expansion, party selection) update local state

## Key Utilities

### vCon Validation (`src/utils/vconValidator.js`)
- `detectVconType(input)` - Detects 'unsigned', 'signed', or 'encrypted' vCon formats
- `validateVcon(input)` - Comprehensive validation against vCon v0.3.0 specification
- `parseVcon(input)` - Safe JSON parsing with error handling

### Testing Strategy
- Unit tests for utilities: `src/utils/__tests__/vconValidator.test.js`
- Test configuration: Vitest with Happy DOM environment
- Coverage reporting with C8 provider
- Fast execution (current tests run in ~8ms)

## Development Patterns

### Component Style
- Functional components with hooks only (no class components)
- Props destructuring with clear parameter names
- Tailwind utility classes over custom CSS
- Lucide React icons for consistent visual language

### State Management
- Custom hooks for complex state logic
- Props drilling avoided through centralized state
- Set-based state for UI elements (expanded nodes)
- Immutable state updates

### File Organization
- One component per file with PascalCase naming
- Co-located tests in `__tests__` directories
- Utilities separated from UI components
- Sample data isolated in `src/data/`

## vCon Format Support

The application handles three vCon formats:
1. **Unsigned vCon**: Direct JSON with `vcon` and `uuid` properties
2. **Signed vCon (JWS)**: Contains `payload` and `signatures` 
3. **Encrypted vCon (JWE)**: Contains `ciphertext` and `protected`

Format detection is automatic via JSON structure analysis in `detectVconType()`.

## Configuration Files

- `vite.config.js` - Build configuration with GitHub Pages base path `/vcon-info/`
- `tailwind.config.js` - Extended with custom gray-850 color
- `package.json` - All scripts and dependencies defined here
- Test setup in `src/test/setup.js`

## Deployment Configuration

- GitHub Pages deployment via `.github/workflows/deploy.yml`
- Base path configured for GitHub Pages subdirectory structure
- Automatic builds on main branch pushes
- Manual deployment available via `bun run deploy`

## Development Tips

- Use sample data from `src/data/sampleData.js` for testing
- Validation is real-time - changes reflect immediately
- Tree expansion state persists across tab switches
- All vCon processing happens client-side (no server required)