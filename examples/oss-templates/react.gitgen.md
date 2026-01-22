---
output:
context:
  - ./package.json
  - ./packages/react/index.js
  - ./packages/react/src/React.js
  - ./packages/react-dom/index.js
---
# React - A JavaScript library for building user interfaces

## Project Overview
React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components". React maintains a virtual DOM and uses a reconciliation algorithm to efficiently update the real DOM.

## Tech Stack
- **Runtime**: JavaScript (Flow type annotations)
- **Build**: Rollup bundler with custom build pipeline
- **Testing**: Jest for unit tests, internal fixtures for integration
- **Package Manager**: Yarn workspaces (monorepo)

## Architecture

### Core Packages
- `react` - Core React APIs (createElement, hooks, etc.)
- `react-dom` - DOM-specific rendering
- `react-reconciler` - The reconciliation algorithm
- `scheduler` - Cooperative scheduling

### Key Concepts
- **Fiber Architecture**: Work-in-progress tree for incremental rendering
- **Reconciliation**: Diffing algorithm to minimize DOM operations
- **Hooks**: State and lifecycle in function components

## Coding Conventions

### File Organization
- `packages/*/src/` - Source code
- `packages/*/src/__tests__/` - Tests colocated with source
- `fixtures/` - Integration test fixtures

### Naming
- Functions: camelCase
- Components: PascalCase
- Files: PascalCase for components, camelCase for utilities
- Private methods: Prefix with `_` or use closures

### Code Style
- 2-space indentation
- Single quotes
- Semicolons required
- Flow type annotations (not TypeScript)
- 80 character line limit

### Testing
- Unit tests with Jest
- Integration tests in fixtures/
- `yarn test` runs all tests
- `yarn test --watch` for development

## Adding New Features

1. **Propose in React RFCs first** - Major features need RFC approval
2. **Follow the package structure** - New APIs go in appropriate package
3. **Add comprehensive tests** - Both unit and integration
4. **Update TypeScript definitions** - In DefinitelyTyped
5. **Consider backwards compatibility** - React has deprecation cycles
