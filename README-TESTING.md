# Testing Guide

This document describes the lightweight testing approach for vCon Info.

## Overview

- **Unit Tests**: Pure JavaScript logic testing with bun's built-in test runner
- **Integration Tests**: Full browser testing with Puppeteer and headless Chrome
- **Philosophy**: Zero dependencies, idempotent runs, no background services

## Setup

```bash
# Install test dependencies
bun install

# Run all tests
bun test

# Run only unit tests
bun test:unit

# Run only integration tests  
bun test:integration

# Watch mode for development
bun test:watch
```

## Test Structure

```
tests/
├── unit/                    # Unit tests for pure logic
│   ├── validation-service.test.js
│   └── state-manager.test.js
├── integration/             # Browser integration tests
│   └── app-integration.test.js
└── setup/                   # Test utilities and helpers
    └── test-helpers.js
```

## Unit Tests

Unit tests focus on pure JavaScript logic without DOM dependencies:

- **ValidationService**: vCon parsing, validation, format detection
- **StateManager**: State management, subscriptions, updates
- **Utilities**: Helper functions, data transformations

### Example Unit Test

```javascript
import { describe, test, expect } from "bun:test";
import { ValidationService } from "../../docs/js/services/validation-service.js";

describe("Unit: ValidationService", () => {
  test("detects unsigned vCon", () => {
    const service = new ValidationService();
    const input = JSON.stringify({ vcon: "0.3.0", uuid: "test-uuid" });
    expect(service.detectVconType(input)).toBe("unsigned");
  });
});
```

## Integration Tests

Integration tests use Puppeteer to test the full application in a real browser:

- **Page Loading**: Verify all components load correctly
- **User Interactions**: Tab switching, input validation, tree expansion
- **Data Flow**: End-to-end data processing and display
- **Error Handling**: Graceful error states and recovery

### Example Integration Test

```javascript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import puppeteer from "puppeteer";

describe("Integration: App", () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto("http://localhost:8081");
  });

  test("validates vCon input", async () => {
    await page.type('#vcon-input', '{"vcon":"0.3.0"}');
    await page.waitForTimeout(500);
    
    const status = await page.$('#validation-status .text-green-400');
    expect(status).not.toBeNull();
  });
});
```

## Test Server

A minimal static file server is included for integration tests:

```javascript
// serve.js - Lightweight static server for testing
bun run serve     # Start server on port 8080
PORT=8081 bun run serve  # Custom port
```

## Test Helpers

Common utilities are provided in `tests/setup/test-helpers.js`:

- **createSampleVcon()**: Generate test vCon data
- **createMockDOM()**: Mock DOM for unit tests
- **waitFor()**: Async condition waiting
- **createMockStateManager()**: Mock state management

## Running Tests

### Development Workflow

```bash
# Start development with watch mode
bun test:watch

# Run specific test file
bun test tests/unit/validation-service.test.js

# Run with coverage (CI)
bun test:ci
```

### CI/CD Integration

Tests are designed to run idempotently in CI environments:

- No external dependencies or databases
- Self-contained test server
- Deterministic test data
- Proper cleanup and teardown

## Best Practices

### Unit Tests
- Test pure functions without side effects
- Mock external dependencies (DOM, services)
- Focus on business logic and edge cases
- Use descriptive test names

### Integration Tests
- Test user workflows end-to-end
- Verify UI interactions and state changes
- Use realistic data and scenarios
- Include error conditions and edge cases

### General
- Tests should be fast and reliable
- No external network dependencies
- Clean up resources properly
- Use meaningful assertions

## Debugging Tests

```bash
# Run single test with verbose output
bun test --verbose tests/unit/validation-service.test.js

# Debug integration tests (non-headless)
# Modify puppeteer launch options: headless: false

# View test server in browser
bun run serve
# Open http://localhost:8080
```

## Adding New Tests

1. **Unit Tests**: Add to `tests/unit/` for pure logic
2. **Integration Tests**: Add to `tests/integration/` for UI workflows
3. **Helpers**: Add reusable utilities to `tests/setup/test-helpers.js`
4. **Follow naming**: `*.test.js` suffix for all test files

## Performance Considerations

- Unit tests run in ~100ms
- Integration tests include browser startup (~2s)
- Use `test:unit` for rapid feedback during development
- Full test suite completes in under 30 seconds