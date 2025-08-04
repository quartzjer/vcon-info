# vCon Info

A static developer tool for the new vCon standards, serving a similar utility as JWT.io does for the OAUTH/JOSE dev community. This tool allows developers to decode, inspect, and validate vCon (Virtual Conversation) data structures in a user-friendly interface.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Project Architecture](#project-architecture)
- [Component Documentation](#component-documentation)
- [State Management](#state-management)
- [Utilities](#utilities)
- [Styling & Design](#styling--design)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **🔍 Decode & Inspect**: Parse and visualize vCon data structures with interactive tree views
- **✅ Real-time Validation**: Instant validation of vCon format with detailed error reporting
- **🔐 Multiple Formats**: Support for unsigned, JWS signed, and JWE encrypted vCons
- **⏱️ Interactive Timeline**: Visual timeline view of dialog sequences and conversation flow
- **🔒 Client-Side Only**: All processing happens in your browser - your data never leaves your device
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎨 Dark Theme**: Professional dark theme optimized for developer workflows
- **🚀 Fast Performance**: Pure vanilla JavaScript with zero dependencies for lightning-fast performance

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/vcon-info.git
cd vcon-info

# Start development server
python3 -m http.server 8080
# or use any static file server
npx serve docs/

# Open http://localhost:8080 in your browser
```

## Development

### Prerequisites

- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **Static File Server**: Python, Node.js, or any web server
- **Git**: For version control

### Development Workflow

1. **Start Development**: Serve the `docs/` directory with any static file server
2. **Make Changes**: Edit HTML, CSS, or JavaScript files directly
3. **Refresh Browser**: Changes are reflected immediately on page refresh
4. **Test**: Use the sample vCon data or paste your own vCon structures
5. **Deploy**: Push changes to main branch for automatic GitHub Pages deployment

## Project Architecture

### Directory Structure

```
vcon-info/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── docs/                       # Production site files (served by GitHub Pages)
│   ├── index.html             # Main HTML structure
│   ├── css/
│   │   └── styles.css         # Compiled Tailwind CSS styles
│   ├── js/
│   │   ├── main.js            # Application entry point
│   │   ├── state-manager.js   # Custom state management system
│   │   ├── vcon-validator.js  # Pure vCon validation logic
│   │   ├── sample-data.js     # Sample vCon data for testing
│   │   └── components/
│   │       ├── inspector-tree.js    # Tree view component
│   │       ├── timeline-view.js     # Timeline visualization
│   │       ├── validation-status.js # Status bar component
│   │       └── tab-manager.js       # Tab switching logic
│   └── shield.svg             # App icon
├── CLAUDE.md                  # Development guidelines for AI assistants
└── README.md                  # This file
```

### Technology Stack

- **Frontend**: Pure vanilla JavaScript with ES6 modules
- **Styling**: Tailwind CSS (utility-first CSS framework)  
- **Icons**: Lucide icons (inline SVG)
- **State Management**: Custom event-driven state system
- **Deployment**: GitHub Pages with GitHub Actions
- **Dependencies**: Zero external dependencies

### Design Patterns

- **Modular Architecture**: ES6 modules for clean separation of concerns
- **Event-Driven State**: Custom state management with subscribe/notify pattern
- **Component Classes**: Reusable component classes with lifecycle methods
- **Separation of Concerns**: Clear separation between UI, logic, and data
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

## Component Documentation

### Core Components

#### `main.js` - Application Entry Point
The main application controller that initializes all components and coordinates the overall application lifecycle.

**Key Responsibilities:**
- Component initialization and coordination
- Sample data loading
- Global event handler setup
- Application state orchestration

#### `state-manager.js` - State Management System
Custom state management system that replaces React hooks with an event-driven architecture.

**Features:**
- Event-driven state updates with subscribe/notify pattern
- Automatic validation on input changes
- State persistence and synchronization
- Debounced input handling for performance

**Key Methods:**
- `subscribe(property, callback)`: Listen to state changes
- `setInput(value)`: Update input with validation
- `setActiveTab(tab)`: Switch between inspector tabs
- `toggleNode(nodeKey)`: Expand/collapse tree nodes

#### `validation-status.js` - Status Display Component
Shows the current validation status of the input vCon and provides action buttons for cryptographic operations.

**Features:**
- Color-coded status indicators
- Context-aware action buttons  
- Signature verification and decryption triggers
- Real-time validation feedback

#### `tab-manager.js` - Tabbed Interface Controller
Manages the tabbed interface for different views of vCon data with automatic content switching.

**Tabs:**
- **Inspector**: Interactive tree view of vCon structure
- **Timeline**: Visual timeline of dialog events
- **Raw**: Formatted JSON display with syntax highlighting

**Features:**
- Dynamic tab content loading
- State-aware tab activation
- Syntax highlighting for raw JSON view

### Specialized Components

#### `inspector-tree.js` - Interactive Tree View
Creates expandable/collapsible tree structures for visualizing vCon data hierarchy.

**Features:**
- Expandable/collapsible tree nodes
- Icon-based visual hierarchy
- Party reference linking
- Hover effects and accessibility
- Real-time tree state management

#### `timeline-view.js` - Dialog Timeline Visualization
Visualizes the chronological flow of dialog events in a conversation with advanced filtering.

**Features:**
- Chronological event ordering by timestamps
- Visual timeline with connecting lines
- Party participation indicators and filtering
- Duration and metadata display
- Content preview with truncation
- Type-based color coding for different dialog types

## State Management

### `state-manager.js` - Custom State System
Event-driven state management system that provides centralized application state without external dependencies.

**State Variables:**
```javascript
{
  // Input and parsing
  input: string,              // Raw JSON input
  vconData: object|null,      // Parsed vCon data
  
  // UI state
  activeTab: string,          // Current inspector tab ('inspector', 'timeline', 'raw')
  expandedNodes: Set,         // Expanded tree nodes
  selectedParty: number|null, // Highlighted party for filtering
  
  // Validation
  validationStatus: string,   // 'idle' | 'valid' | 'invalid'
  vconType: string,          // 'unsigned' | 'signed' | 'encrypted'
  
  // Cryptographic operations
  showKeyInput: boolean,      // Key input form visibility
  publicKey: string,          // Public key for verification
  privateKey: string,         // Private key for decryption
}
```

**Event System:**
- **Subscribe/Notify Pattern**: Components subscribe to state changes
- **Automatic Validation**: Input changes trigger validation and parsing
- **Debounced Updates**: Input handling is debounced for performance
- **State Persistence**: Maintains state across user interactions

**Key Methods:**
- `subscribe(property, callback)`: Register listener for state changes
- `setInput(value)`: Update input with automatic validation
- `setActiveTab(tab)`: Switch between inspector tabs
- `toggleNode(nodeKey)`: Toggle tree node expansion state
- `getState(property)`: Get current value of state property

## Utilities

### `vconValidator.js` - Validation & Parsing
Core utility functions for vCon data processing.

**Functions:**

#### `detectVconType(input: string): string|null`
Analyzes JSON input to determine the vCon format type.
- **Returns**: 'signed' (JWS), 'encrypted' (JWE), 'unsigned', or null
- **Logic**: Checks for `signatures`, `ciphertext`, or `vcon` properties

#### `validateVcon(input: string): string`
Validates the structure and format of vCon data.
- **Returns**: 'idle', 'valid', or 'invalid'
- **Checks**: JSON parsing, required properties, format compliance

#### `parseVcon(input: string): object|null`
Safely parses JSON input with error handling.
- **Returns**: Parsed object or null on failure
- **Features**: Graceful error handling, no exceptions thrown

### Sample Data (`sampleData.js`)
Provides realistic sample data for testing and demonstration.

**Exports:**
- `sampleVcon`: Complete unsigned vCon with parties, dialog, analysis, and attachments
- `sampleJWS`: Sample JWS signature structure for signed vCons

**Features:**
- Realistic customer support conversation scenario
- Multiple dialog types (recording, text)
- Analysis data (transcription, sentiment)
- Attachment references with content hashes

## Styling & Design

### Tailwind CSS Configuration
Custom Tailwind configuration extends the default theme:

```javascript
// tailwind.config.js
{
  colors: {
    gray: {
      850: '#1f2937',  // Custom dark gray for enhanced dark theme
    }
  }
}
```

### Design System

**Color Palette:**
- **Background**: `bg-gray-900` (primary), `bg-gray-800` (secondary)
- **Text**: `text-gray-100` (primary), `text-gray-300` (secondary), `text-gray-400` (muted)
- **Accents**: `text-blue-400` (links, highlights), `text-green-500` (success), `text-red-500` (errors)
- **Borders**: `border-gray-700` (subtle), `border-green-600`/`border-red-600` (status)

**Typography:**
- **Headings**: Default font with bold weights
- **Code**: `font-mono` for JSON display and technical content
- **Body**: Default system font stack for optimal readability

**Layout Principles:**
- **Container-based**: Consistent max-width containers with responsive padding
- **Grid System**: CSS Grid for main layout, Flexbox for component internals
- **Spacing**: Consistent Tailwind scale (4px base unit)
- **Responsive**: Mobile-first design with desktop enhancements

## Deployment

### Automatic GitHub Pages Deployment
The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys the application when changes are pushed to the main branch.

**Workflow Steps:**
1. **Checkout**: Retrieves the latest code from the repository
2. **Deploy**: Directly deploys the `docs/` directory to GitHub Pages

**Configuration:**
- **Trigger**: Push to main branch
- **Source Directory**: `./docs/` directory (no build step required)
- **Base Path**: Configured for GitHub Pages subdirectory deployment

### Manual Deployment
For manual deployment or other hosting services:

```bash
# Copy docs/ contents to your hosting service
cp -r docs/* /path/to/webserver/

# Or serve directly with any static file server
python3 -m http.server 8080 --directory docs/
npx serve docs/
```

### Environment Configuration
The application is configured for GitHub Pages deployment:
- **Base Path**: Automatically detects GitHub Pages subdirectory structure
- **Static Assets**: All assets are included in the `docs/` directory
- **Zero Dependencies**: No build process or external dependencies required

## Contributing

### Development Setup
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/your-feature-name`
4. **Develop** your changes by editing files in `docs/`
5. **Test** locally with a static file server
6. **Test** thoroughly with various vCon formats
7. **Commit** your changes with descriptive messages
8. **Push** to your fork and create a pull request

### Code Style Guidelines
- **Components**: Use ES6 classes with clear lifecycle methods
- **Naming**: PascalCase for classes, camelCase for functions/variables
- **File Organization**: One component per file, modular imports/exports
- **State Management**: Use the central state manager for all shared state
- **Styling**: Prefer Tailwind utility classes over custom CSS
- **Events**: Use event delegation and the state manager's event system

### Adding New Features

#### Adding a New Inspector Tab
1. Create a new view component class in `docs/js/components/`
2. Add the tab button to the HTML in `index.html`
3. Register the new tab in `tab-manager.js`
4. Update the state manager to handle the new tab type

#### Adding New vCon Format Support
1. Update `detectVconType()` in `vcon-validator.js`
2. Add validation logic to `validateVcon()`
3. Update the UI components to handle the new format
4. Add sample data for testing in `sample-data.js`

#### Extending Validation Rules
1. Modify `validateVcon()` function in `vcon-validator.js`
2. Add specific error messages and status types
3. Update validation status component to display new states
4. Test with various edge cases and malformed input

### Testing Strategy

This project uses manual testing and browser-based validation for quality assurance.

#### Manual Testing Guidelines
- **Sample Data Testing**: Use provided sample data and real vCon structures
- **Format Testing**: Test with unsigned, signed, and encrypted vCons
- **Error Testing**: Verify graceful handling of malformed input
- **Responsive Testing**: Ensure mobile and desktop compatibility
- **Performance Testing**: Test with large vCon structures
- **Cross-browser Testing**: Verify compatibility across modern browsers

#### Browser Console Testing
The application provides console debugging tools:
```javascript
// Load sample data
vconApp.loadSample()              // Unsigned vCon
vconApp.loadSample('signed')      // JWS signed vCon

// Debug application state
vconApp.getAppState()             // Current app state
console.log(stateManager.state)   // Raw state object

// Test validation functions
import('./js/vcon-validator.js').then(validator => {
  console.log(validator.validateVcon(yourVconString));
});
```

#### Testing Checklist
- ✅ **Format Detection**: Validates unsigned, signed, and encrypted vCons
- ✅ **JSON Validation**: Handles malformed JSON gracefully
- ✅ **vCon Structure Validation**: Validates against vCon v0.3.0 specification
- ✅ **Interactive Features**: Tree expansion, tab switching, party filtering
- ✅ **Responsive Design**: Mobile and desktop layouts
- ✅ **Error Handling**: Graceful degradation for all error states

## License

MIT License - see LICENSE file for details

---

## Resources

- **vCon Specification**: [IETF vCon Working Group](https://datatracker.ietf.org/wg/vcon/about/)
- **JWT.io**: [JWT.io](https://jwt.io/) - Inspiration for this tool
- **Tailwind CSS**: [TailwindCSS.com](https://tailwindcss.com/)
- **MDN Web Docs**: [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
