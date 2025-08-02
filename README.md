# vCon Inspector

A static SPA developer tool for the new vCon standards, serving a similar utility as JWT.io does for the OAUTH/JOSE dev community. This tool allows developers to decode, inspect, and validate vCon (Virtual Conversation) data structures in a user-friendly interface.

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
- **🚀 Fast Performance**: Built with Vite for lightning-fast development and optimized builds

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/vcon-info.git
cd vcon-info

# Install dependencies
bun install

# Start development server (opens at http://localhost:3000)
bun dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Development

### Prerequisites

- **Bun**: Version 1.0 or higher
- **Git**: For version control

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build locally |
| `bun run deploy` | Build and deploy to GitHub Pages |

### Development Workflow

1. **Start Development**: Run `bun dev` to start the development server
2. **Make Changes**: Edit files in the `src/` directory
3. **Hot Reload**: Changes are automatically reflected in the browser
4. **Test**: Use the sample vCon data or paste your own vCon structures
5. **Build**: Run `bun run build` to create production build
6. **Deploy**: Push to main branch or run `bun run deploy`

## Project Architecture

### Directory Structure

```
vcon-info/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── shield.svg              # Favicon and app icon
├── src/
│   ├── components/             # React components (UI building blocks)
│   │   ├── Header.jsx          # Site header with navigation
│   │   ├── ValidationStatusBar.jsx  # Status display with actions
│   │   ├── KeyInput.jsx        # Cryptographic key input form
│   │   ├── InputPane.jsx       # JSON input textarea
│   │   ├── InspectorPane.jsx   # Tabbed inspector container
│   │   ├── InspectorView.jsx   # Main tree view for vCon structure
│   │   ├── TimelineView.jsx    # Dialog timeline visualization
│   │   ├── RawView.jsx         # Raw JSON display with formatting
│   │   ├── TreeNode.jsx        # Reusable collapsible tree component
│   │   ├── PartyLink.jsx       # Interactive party reference links
│   │   ├── Footer.jsx          # Site footer with privacy info
│   │   └── VConInspector.jsx   # Main orchestrating component
│   ├── hooks/
│   │   └── useVconState.js     # Custom hook for vCon state management
│   ├── utils/
│   │   └── vconValidator.js    # Validation and parsing utilities
│   ├── data/
│   │   └── sampleData.js       # Sample vCon data for testing
│   ├── App.jsx                 # Root application component
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles and Tailwind imports
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite build configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── README.md                   # This file
```

### Technology Stack

- **Frontend Framework**: React 18 with JSX
- **Build Tool**: Vite (fast builds, hot module replacement)
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **Icons**: Lucide React (consistent icon library)
- **Deployment**: GitHub Pages with GitHub Actions
- **Package Manager**: Bun

### Design Patterns

- **Component Composition**: Small, focused components that compose into larger features
- **Custom Hooks**: Logic extraction using React hooks for reusability
- **Separation of Concerns**: Clear separation between UI, logic, and data
- **Prop Drilling Avoidance**: State management through custom hooks
- **Functional Components**: Modern React with hooks (no class components)

## Component Documentation

### Core Components

#### `VConInspector.jsx` - Main Application
The root component that orchestrates the entire application. It uses the `useVconState` hook to manage state and renders all major UI sections.

**Key Responsibilities:**
- State management coordination
- Layout structure
- Event handling delegation

#### `Header.jsx` - Site Header
Displays the application title, tagline, and navigation links.

**Props:** None (static component)
**Features:**
- Shield icon with app branding
- Navigation links to IETF drafts and documentation
- Responsive design

#### `ValidationStatusBar.jsx` - Status Display
Shows the current validation status of the input vCon and provides action buttons for cryptographic operations.

**Props:**
- `validationStatus`: Current validation state ('idle', 'valid', 'invalid')
- `vconType`: Detected vCon type ('unsigned', 'signed', 'encrypted')
- `showKeyInput`: Boolean for key input visibility
- `setShowKeyInput`: Function to toggle key input

**Features:**
- Color-coded status indicators
- Context-aware action buttons
- Signature verification and decryption triggers

#### `InputPane.jsx` - JSON Input Area
Provides a textarea for users to paste vCon data with syntax highlighting and formatting.

**Props:**
- `input`: Current input text
- `setInput`: Function to update input text

**Features:**
- Monospace font for JSON readability
- Auto-resize functionality
- Placeholder text with format hints

#### `InspectorPane.jsx` - Tabbed Inspector
Container component that manages the tabbed interface for different views of vCon data.

**Props:**
- `activeTab`: Currently selected tab
- `setActiveTab`: Function to change active tab
- `vconData`: Parsed vCon data object
- `vconType`: Type of vCon being displayed
- `validationStatus`: Current validation state
- `expandedNodes`: Set of expanded tree nodes
- `toggleNode`: Function to toggle node expansion
- `selectedParty`: Currently selected party index
- `setSelectedParty`: Function to select a party

**Tabs:**
- **Inspector**: Interactive tree view of vCon structure
- **Timeline**: Visual timeline of dialog events
- **Raw**: Formatted JSON display

### Specialized Components

#### `TreeNode.jsx` - Collapsible Tree Structure
Reusable component for creating expandable/collapsible tree structures.

**Props:**
- `label`: Display text for the node
- `children`: Child nodes/content
- `icon`: Lucide icon component
- `nodeKey`: Unique identifier for expansion state
- `expandedNodes`: Set of expanded nodes
- `toggleNode`: Function to toggle expansion

**Features:**
- Chevron indicators for expand/collapse state
- Icon support for visual hierarchy
- Hover effects and accessibility

#### `PartyLink.jsx` - Interactive Party References
Displays party references with hover interactions for highlighting relationships.

**Props:**
- `parties`: Array of party indices
- `setSelectedParty`: Function to highlight a party

**Features:**
- Hover highlighting of referenced parties
- Visual indication of party relationships
- Click/hover interactions

#### `TimelineView.jsx` - Dialog Timeline
Visualizes the chronological flow of dialog events in a conversation.

**Props:**
- `vconData`: Complete vCon data object

**Features:**
- Chronological event ordering
- Visual timeline with connecting lines
- Party participation indicators
- Duration and timestamp display

## State Management

### `useVconState.js` - Custom Hook
Centralized state management for the entire vCon inspector application.

**State Variables:**
```javascript
{
  // Input and parsing
  input: string,              // Raw JSON input
  vconData: object|null,      // Parsed vCon data
  
  // UI state
  activeTab: string,          // Current inspector tab
  expandedNodes: Set,         // Expanded tree nodes
  selectedParty: number|null, // Highlighted party
  
  // Validation
  validationStatus: string,   // 'idle' | 'valid' | 'invalid'
  vconType: string,          // 'unsigned' | 'signed' | 'encrypted'
  
  // Cryptographic operations
  showKeyInput: boolean,      // Key input form visibility
  publicKey: string,          // Public key for verification
  privateKey: string,         // Private key for decryption
}
```

**Effects:**
- **Format Detection**: Automatically detects vCon type from input
- **Validation**: Real-time validation of JSON structure
- **Sample Data**: Loads sample vCon on application start

**Functions:**
- `toggleNode(nodeKey)`: Toggles expansion state of tree nodes
- All state setters for controlled components

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
The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application when changes are pushed to the main branch.

**Workflow Steps:**
1. **Checkout**: Retrieves the latest code
2. **Setup Bun**: Installs Bun and caches dependencies
3. **Install**: Runs `bun install` for clean dependency installation
4. **Build**: Executes `bun run build` to create production assets
5. **Deploy**: Uses `peaceiris/actions-gh-pages` to deploy to GitHub Pages

**Configuration:**
- **Trigger**: Push to main branch or pull requests
- **Build Output**: `./dist` directory
- **Base Path**: Configured for GitHub Pages subdirectory deployment

### Manual Deployment
For manual deployment or other hosting services:

```bash
# Build production assets
bun run build

# Deploy to GitHub Pages (requires gh-pages package)
bun run deploy

# Or copy ./dist contents to your hosting service
```

### Environment Configuration
The Vite configuration (`vite.config.js`) includes:
- **Base Path**: `/vcon-info/` for GitHub Pages compatibility
- **Asset Directory**: `assets/` for organized build output
- **Development Server**: Port 3000 with auto-open browser

## Contributing

### Development Setup
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install** dependencies with `bun install`
4. **Create** a feature branch: `git checkout -b feature/your-feature-name`
5. **Develop** your changes with `bun dev`
6. **Test** thoroughly with various vCon formats
7. **Build** to ensure production compatibility: `bun run build`
8. **Commit** your changes with descriptive messages
9. **Push** to your fork and create a pull request

### Code Style Guidelines
- **Components**: Use functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Organization**: One component per file, co-locate related utilities
- **Props**: Use object destructuring and provide PropTypes/TypeScript types
- **Styling**: Prefer Tailwind utility classes over custom CSS
- **State**: Use custom hooks for complex state logic

### Adding New Features

#### Adding a New Inspector Tab
1. Create a new view component in `src/components/`
2. Add the tab button to `InspectorPane.jsx`
3. Include the view in the conditional rendering logic
4. Update the `activeTab` state management

#### Adding New vCon Format Support
1. Update `detectVconType()` in `vconValidator.js`
2. Add validation logic to `validateVcon()`
3. Update the UI to handle the new format
4. Add sample data for testing

#### Extending Validation Rules
1. Modify `validateVcon()` function
2. Add specific error messages and status types
3. Update the UI to display new validation states
4. Test with various edge cases

### Testing Strategy

This project uses **Vitest** with **React Testing Library** for fast, reliable testing.

#### Quick Testing Commands
```bash
# Run tests in watch mode (recommended for development)
bun test

# Run tests once (CI mode)
bun test:run

# Generate coverage report with HTML output
bun test:coverage

# Open interactive test UI in browser
bun test:ui
```

#### Current Test Coverage
- ✅ **17/17 utility tests passing** for vCon validation functions
- ✅ **Format detection** for unsigned, signed, and encrypted vCons
- ✅ **JSON validation** and parsing with error handling
- ✅ **vCon structure validation** against specification
- 🚧 **Component testing** (planned expansion)
- 🚧 **Integration testing** (planned expansion)

#### Test Performance
- **Lightning fast**: Current test suite runs in ~8ms
- **Hot reload**: Tests automatically rerun on file changes
- **Coverage tracking**: Built-in HTML coverage reports
- **CI ready**: Deterministic results for continuous integration

#### Manual Testing Guidelines
- **Sample Data Testing**: Use provided sample data and real vCon structures
- **Format Testing**: Test with unsigned, signed, and encrypted vCons
- **Error Testing**: Verify graceful handling of malformed input
- **Responsive Testing**: Ensure mobile and desktop compatibility
- **Performance Testing**: Test with large vCon structures

See [TESTING.md](./TESTING.md) for detailed testing documentation, examples, and expansion plans.

## License

MIT License - see LICENSE file for details

---

## Resources

- **vCon Specification**: [IETF vCon Working Group](https://datatracker.ietf.org/wg/vcon/about/)
- **JWT.io**: [JWT.io](https://jwt.io/) - Inspiration for this tool
- **React Documentation**: [React.dev](https://react.dev/)
- **Tailwind CSS**: [TailwindCSS.com](https://tailwindcss.com/)
- **Vite**: [Vitejs.dev](https://vitejs.dev/)
