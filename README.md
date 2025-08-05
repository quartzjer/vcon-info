# vCon Info

A static developer tool for vCon standards - similar to JWT.io for OAUTH/JOSE. This tool allows developers to decode, inspect, and validate vCon (Virtual Conversation) data structures with support for unsigned, JWS signed, and JWE encrypted formats.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **🔍 Decode & Inspect**: Parse and visualize vCon data structures with interactive inspector view
- **✅ Real-time Validation**: Status indicator shows vCon format validation
- **📋 Tabbed Interface**: Inspector and Timeline views for different data perspectives  
- **⚡ Interactive UI**: Collapsible sections and clickable elements for better navigation
- **🔒 Client-Side Only**: All processing happens in your browser - your data never leaves your device
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🚀 Zero Dependencies**: Pure vanilla JavaScript for fast performance and reliability

## Quick Start

```bash
# Clone the repository
git clone https://github.com/quartzjer/vcon-info.git
cd vcon-info

# Install dependencies for testing (optional)
bun install

# Start development server
bun run serve
# or use any static file server:
# python3 -m http.server 8080 --directory docs/
# npx serve docs/

# Open http://localhost:8080 in your browser
```

## Development

### Prerequisites

- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **Bun**: For running the development server and tests (or any static file server)
- **Git**: For version control

### Development Workflow

1. **Start Development**: `bun run serve` to serve the `docs/` directory
2. **Make Changes**: Edit files in the `docs/` directory 
3. **Refresh Browser**: Changes are reflected immediately on page refresh
4. **Test**: Run `bun test` for integration tests or manual testing in browser
5. **Deploy**: Push changes to main branch for automatic GitHub Pages deployment

## Project Structure

### Directory Structure

```
vcon-info/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── docs/                       # Production site files (served by GitHub Pages)
│   ├── index.html             # Main HTML structure and content
│   ├── scripts.js             # Application JavaScript logic
│   ├── style.css              # Custom CSS styles
│   └── CNAME                  # GitHub Pages domain configuration
├── tests/                     # Test suite
│   ├── integration/
│   │   └── app-integration.test.js  # Puppeteer integration tests
│   └── setup/
│       └── test-helpers.js    # Test utilities
├── package.json               # Project dependencies and scripts
├── serve.js                   # Bun development server
├── CLAUDE.md                  # Development guidelines for AI assistants
└── README.md                  # This file
```

### Technology Stack

- **Frontend**: Pure vanilla JavaScript (single-file application)
- **Styling**: Custom CSS with responsive design
- **Testing**: Bun test runner with Puppeteer for browser automation
- **Development**: Bun for development server and package management
- **Deployment**: GitHub Pages with GitHub Actions
- **Dependencies**: Zero runtime dependencies (Puppeteer for testing only)

## Core Application Logic

### `scripts.js` - Main Application
Single JavaScript file containing all application functionality:

**Key Features:**
- **Tab Management**: Switch between Inspector and Timeline tabs
- **Collapsible UI**: Expandable/collapsible sections for better navigation
- **Input Handling**: Basic input change detection with validation stubs
- **Sample Data**: Built-in sample vCon data for testing
- **State Objects**: Simple state management for testing compatibility

**Main Functions:**
- `parseVcon(input)`: Basic JSON parsing with error handling
- `updateInspector(vcon)`: Placeholder for inspector updates (stub)
- `updateValidationStatus(isValid, message)`: Validation status updates (stub)
- `updateTimeline(vcon)`: Timeline visualization updates (stub)

**Global Objects:**
- `vconApp`: Main application object with `loadSample()` method
- `stateManager`: Basic state management for testing compatibility

## Testing

The project includes comprehensive integration testing using Bun and Puppeteer.

### Running Tests

```bash
# Install test dependencies
bun install

# Run all tests
bun test

# Run tests with coverage
bun test:ci

# Run tests in watch mode
bun test:watch
```

### Test Coverage

- **Page Load**: Verifies main page loads with required elements
- **Input Validation**: Tests basic validation and error handling
- **Tab Navigation**: Ensures tab switching works correctly
- **Inspector Tree**: Validates tree structure and interactivity
- **Sample Data**: Tests sample data loading functionality
- **Error Handling**: Ensures graceful error handling
- **Screenshot Testing**: Generates visual snapshots for regression testing

### Test Structure

- `tests/integration/app-integration.test.js`: Main integration test suite
- `tests/setup/test-helpers.js`: Test utilities and helpers
- `tests/snapshot.png`: Generated screenshot for visual testing

## Deployment

### Automatic GitHub Pages Deployment
The project automatically deploys to GitHub Pages on push to main branch.

**Workflow:**
1. **Trigger**: Push to main branch
2. **Deploy**: `docs/` directory deployed directly to GitHub Pages
3. **No Build**: Static files deployed as-is

### Manual Deployment

```bash
# Serve locally
bun run serve

# Or use any static file server
python3 -m http.server 8080 --directory docs/
npx serve docs/
```

## Contributing

### Development Setup
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install dependencies**: `bun install`
4. **Create** a feature branch: `git checkout -b feature/your-feature-name`
5. **Start development server**: `bun run serve`
6. **Make changes** to files in `docs/` directory
7. **Test** your changes: `bun test`
8. **Commit** and push your changes
9. **Create** a pull request

### Code Style Guidelines
- **JavaScript**: Use vanilla JavaScript with clear, readable functions
- **HTML**: Semantic HTML5 with accessibility considerations
- **CSS**: Custom CSS with responsive design principles
- **Testing**: Add integration tests for new functionality
- **Documentation**: Update README.md and CLAUDE.md for significant changes

### Adding New Features

#### Adding UI Elements
1. Update `docs/index.html` with new HTML structure
2. Add styling in `docs/style.css`
3. Add JavaScript functionality in `docs/scripts.js`
4. Add integration tests in `tests/integration/`

#### Extending vCon Support
1. Update validation logic in `parseVcon()` function
2. Add new UI elements for additional vCon properties
3. Update sample data in `vconApp.loadSample()`
4. Add tests for new functionality

## License

MIT License - see LICENSE file for details

---

## Resources

- **vCon Specification**: [IETF vCon Working Group](https://datatracker.ietf.org/wg/vcon/about/)
- **JWT.io**: [JWT.io](https://jwt.io/) - Inspiration for this tool
- **Bun**: [Bun.sh](https://bun.sh/) - JavaScript runtime and package manager
- **Puppeteer**: [Puppeteer](https://pptr.dev/) - Browser automation for testing
