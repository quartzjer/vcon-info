# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vCon Info is a static developer tool for vCon standards - similar to JWT.io for OAUTH/JOSE. It allows developers to decode, inspect, and validate vCon (Virtual Conversation) data structures. Built as a simple vanilla JavaScript application with zero runtime dependencies.

## Development Commands

**Important**: This is a simple static website with zero runtime dependencies. Uses Bun for development and testing.

### Primary Commands
- `bun install` - Install test dependencies (Puppeteer)
- `bun run serve` - Start Bun development server on http://localhost:8080
- `bun test` - Run integration tests with Puppeteer
- `bun test:watch` - Run tests in watch mode
- Alternative static servers: `python3 -m http.server 8080 --directory docs/` or `npx serve docs/`

### Testing
- Integration tests with Bun + Puppeteer in `tests/integration/`
- Manual testing in browser with sample data
- Screenshot testing for visual regression
- Console testing with `vconApp` and `stateManager` global objects

### Deployment
- GitHub Pages deployment via `.github/workflows/deploy.yml`
- Automatic deployment on push to main branch
- Serves `docs/` directory directly

## Technology Stack

- **Frontend**: Pure vanilla JavaScript (single file application)
- **Styling**: Custom CSS with responsive design
- **Testing**: Bun test runner with Puppeteer browser automation
- **Development**: Bun for development server and package management  
- **Runtime Dependencies**: Zero (Puppeteer only for testing)
- **Deployment**: GitHub Pages with GitHub Actions

## Architecture Overview

Simple single-page application with minimal architecture:

### File Structure
- `docs/index.html` - Main HTML with embedded vCon sample data and UI structure
- `docs/scripts.js` - All JavaScript functionality in one file
- `docs/style.css` - Custom CSS styling
- `serve.js` - Bun development server
- `tests/` - Integration test configuration

### Application Logic
- **Tab Management**: Switch between Inspector and Timeline views
- **UI Interactions**: Collapsible sections with expand/collapse functionality
- **Input Processing**: Basic JSON parsing and validation stubs
- **Sample Data**: Built-in vCon examples for testing and demonstration
- **Test Compatibility**: Global objects (`vconApp`, `stateManager`) for testing

## Key Functions

### Core Functions (in `docs/scripts.js`)
- `parseVcon(input)` - Basic JSON parsing with error handling
- `updateInspector(vcon)` - Placeholder for inspector updates (stub)
- `updateValidationStatus(isValid, message)` - Validation status updates (stub) 
- `updateTimeline(vcon)` - Timeline visualization updates (stub)

### Global Objects
- `vconApp.loadSample()` - Load sample vCon data into textarea
- `stateManager.updateInput(value)` - Update input and trigger validation
- Sample vCon data embedded directly in `vconApp.loadSample()` function

## Development Patterns

### Code Style
- Vanilla JavaScript with clear, readable functions
- Event listeners for DOM interactions
- Simple state management with basic objects
- CSS classes for styling, no framework dependencies

### UI Patterns
- Tab switching with active state management
- Collapsible sections with toggle functionality
- Event delegation for click handlers
- Dynamic content updates via DOM manipulation

### File Organization
- Single HTML file with embedded structure and sample data
- Single JavaScript file with all functionality
- Single CSS file with custom styles
- Test files organized in `tests/` directory

## vCon Format Support

The application provides a foundation for vCon format support:
1. **Sample Data**: Contains example unsigned vCon with standard properties
2. **Input Processing**: Basic JSON parsing for any vCon format
3. **UI Structure**: Inspector view designed to display vCon data hierarchically
4. **Extensible Design**: Stub functions ready for validation logic implementation

## Configuration Files

- `docs/index.html` - Main HTML structure with embedded sample data
- `docs/style.css` - Custom CSS styling
- `docs/scripts.js` - All JavaScript application logic
- `package.json` - Bun dependencies and test scripts
- `serve.js` - Development server configuration
- `.github/workflows/deploy.yml` - GitHub Actions deployment
- `tests/` - Integration test suite configuration

## Testing Framework

- **Bun Test Runner**: Uses Bun's built-in test runner
- **Puppeteer Integration**: Browser automation for end-to-end testing
- **Test Coverage**: Page load, input validation, tab navigation, UI interactions
- **Screenshot Testing**: Visual regression testing with snapshot generation
- **CI Integration**: Tests run automatically via GitHub Actions

## Development Tips

- Use `bun run serve` for local development server
- Run `bun test` to validate changes with integration tests
- Sample data available via `vconApp.loadSample()` in browser console
- All processing happens client-side (no server required)
- Global objects `vconApp` and `stateManager` available for debugging
- UI state preserved during development (tab selection, collapsed sections)
- Test new features by adding to `tests/integration/app-integration.test.js`
- Visual changes can be verified with screenshot tests in `tests/snapshot.png`

### Validation Approach
- **DO NOT** run the development server to validate UI changes or fixes
- **DO** add tests to `tests/integration/app-integration.test.js` to verify behavior
- **DO** run `bun test` to validate that changes work correctly
- This approach ensures proper test coverage and avoids manual testing dependencies