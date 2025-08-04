# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vCon Info is a static developer tool for vCon standards - similar to JWT.io for OAUTH/JOSE. It allows developers to decode, inspect, and validate vCon (Virtual Conversation) data structures with support for unsigned, JWS signed, and JWE encrypted formats. Built with pure vanilla JavaScript for maximum performance and zero dependencies.

## Development Commands

**Important**: This is a static vanilla JavaScript project with zero dependencies. No build process is required.

### Primary Commands
- `python3 -m http.server 8080 --directory docs/` - Start development server on http://localhost:8080
- `npx serve docs/` - Alternative static file server
- No installation or build commands needed - just serve the `docs/` directory

### Testing
- Manual testing with browser developer tools
- Use sample data and real vCon structures for validation
- Browser console provides debugging utilities

### Deployment
- Direct deployment of `docs/` directory to any static hosting
- Automatic deployment via GitHub Actions on push to main branch

## Technology Stack

- **Frontend**: Pure vanilla JavaScript with ES6 modules
- **Styling**: Tailwind CSS utility-first framework
- **Icons**: Lucide icons (inline SVG)
- **State Management**: Custom event-driven state system
- **Dependencies**: Zero external dependencies
- **Deployment**: GitHub Pages with GitHub Actions

## Architecture Overview

### Core State Management
The application uses a custom event-driven state management system:
- `state-manager.js` - Central state manager with subscribe/notify pattern
- All components subscribe to state changes and update accordingly
- Automatic validation and parsing on input changes

### Component Structure
- `main.js` - Application entry point and coordinator
- `validation-status.js` - Real-time validation status display
- `tab-manager.js` - Tabbed interface controller (Inspector/Timeline/Raw views)
- `inspector-tree.js` - Interactive tree view component
- `timeline-view.js` - Dialog timeline visualization

### Data Flow
1. User input → StateManager updates
2. Automatic validation via `vcon-validator.js` utilities
3. State changes trigger component updates via event system
4. Interactive components (tree expansion, party selection) update shared state

## Key Utilities

### vCon Validation (`docs/js/vcon-validator.js`)
- `detectVconType(input)` - Detects 'unsigned', 'signed', or 'encrypted' vCon formats
- `validateVcon(input)` - Comprehensive validation against vCon v0.3.0 specification
- `parseVcon(input)` - Safe JSON parsing with error handling

### Sample Data (`docs/js/sample-data.js`)
- Provides realistic sample vCon data for testing
- Includes unsigned vCon and JWS signature examples
- Used for demonstration and validation testing

## Development Patterns

### Component Style
- ES6 classes with clear lifecycle methods
- Event-driven architecture with custom events
- Tailwind utility classes over custom CSS
- Inline SVG icons for consistent visual language

### State Management
- Central StateManager class with subscribe/notify pattern
- Event-driven updates avoid tight coupling
- Set-based state for UI elements (expanded nodes)
- Immutable state updates with validation

### File Organization
- One component per file with kebab-case naming
- Components organized in `docs/js/components/`
- Utilities separated from UI components
- Sample data isolated in `docs/js/sample-data.js`

## vCon Format Support

The application handles three vCon formats:
1. **Unsigned vCon**: Direct JSON with `vcon` and `uuid` properties
2. **Signed vCon (JWS)**: Contains `payload` and `signatures` 
3. **Encrypted vCon (JWE)**: Contains `ciphertext` and `protected`

Format detection is automatic via JSON structure analysis in `detectVconType()`.

## Configuration Files

- `docs/index.html` - Main HTML structure and entry point
- `docs/css/styles.css` - Compiled Tailwind CSS with custom extensions
- `.github/workflows/deploy.yml` - GitHub Actions deployment configuration
- No build configuration needed - static files only

## Deployment Configuration

- GitHub Pages deployment via `.github/workflows/deploy.yml`
- Base path configured for GitHub Pages subdirectory structure
- Automatic builds on main branch pushes
- Manual deployment available via `bun run deploy`

## Development Tips

- Use sample data from `docs/js/sample-data.js` for testing
- Validation is real-time - changes reflect immediately
- Tree expansion state persists across tab switches
- All vCon processing happens client-side (no server required)
- Browser console provides debugging utilities with `vconApp` global object
- Use developer tools to inspect state: `console.log(stateManager.state)`
- Load sample data via console: `vconApp.loadSample()` or `vconApp.loadSample('signed')`