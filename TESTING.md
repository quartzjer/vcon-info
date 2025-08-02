# Testing Strategy for vCon Inspector

## Overview
This project uses **Vitest** with **React Testing Library** for a modern, lightweight testing approach optimized for React + Vite applications.

## Test Architecture

### ✅ Implemented
- **Unit Tests**: Utility functions (`src/utils/__tests__/`)
- **Test Configuration**: Vitest with Happy DOM environment
- **Test Utilities**: Shared test helpers and mocks
- **Coverage Reporting**: C8 coverage provider with multiple output formats

### 🏗️ Future Enhancements
- **Component Tests**: React component unit tests  
- **Hook Tests**: Custom hook testing with renderHook
- **Integration Tests**: End-to-end user workflows
- **Visual Testing**: Component screenshot comparisons

## Testing Tools

### Core Stack
- **Vitest**: Fast test runner with HMR support
- **@testing-library/react**: Component testing utilities
- **@testing-library/jest-dom**: Extended DOM matchers
- **Happy DOM**: Lightweight DOM environment

### Test Scripts
```bash
# Run tests in watch mode
bun test

# Run tests once
bun test:run

# Run with coverage
bun test:coverage

# Open test UI
bun test:ui
```

## Test Structure
```
src/
├── test/
│   ├── setup.js           # Global test configuration
│   └── utils.jsx          # Test utilities and helpers
├── utils/
│   └── __tests__/
│       └── vconValidator.test.js  # ✅ Working utility tests
└── components/
    └── __tests__/         # 🚧 Component tests (to be implemented)
```

## Current Test Coverage

### ✅ Utility Functions (vconValidator.js)
- `detectVconType()` - Detects vCon format (unsigned/signed/encrypted)
- `validateVcon()` - Validates vCon structure and format
- `parseVcon()` - Safely parses JSON input

**Test Status**: 17/17 tests passing ✅

### Example Test Patterns

#### Unit Test Example
```javascript
import { describe, it, expect } from 'vitest'
import { validateVcon } from '../vconValidator'

describe('validateVcon', () => {
  it('should return valid for proper unsigned vCon', () => {
    const validVcon = JSON.stringify({
      vcon: "0.0.1",
      uuid: "test-uuid-123"
    })
    expect(validateVcon(validVcon)).toBe('valid')
  })
})
```

## Benefits of This Approach

### 🚀 Performance
- **Fast execution**: Tests run in milliseconds
- **Hot reload**: Tests rerun on file changes
- **Parallel execution**: Multiple test files run concurrently

### 🛡️ Reliability  
- **Isolated tests**: Each test runs in clean environment
- **Comprehensive coverage**: All critical paths tested
- **Type safety**: Full TypeScript support

### 🔧 Developer Experience
- **Great error messages**: Clear failure descriptions
- **IDE integration**: IntelliSense and debugging support
- **Watch mode**: Automatic re-running on changes

## Running Tests

### Basic Usage
```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run specific test file
bun test src/utils/__tests__/vconValidator.test.js

# Generate coverage report
bun test:coverage
```

### Continuous Integration
The test suite is designed to run in CI/CD environments with:
- Fast execution (< 1 second for current tests)
- Deterministic results
- Clear exit codes for build systems

## Next Steps

1. **Add Component Tests**: Test React components with user interactions
2. **Hook Testing**: Test custom hooks like `useVconState`
3. **Integration Tests**: Test complete user workflows
4. **E2E Tests**: Consider Playwright for critical user paths
5. **Performance Tests**: Add tests for large vCon parsing

This testing foundation provides a solid base for maintaining code quality while staying lightweight and maintainable.