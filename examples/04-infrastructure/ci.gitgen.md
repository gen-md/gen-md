---
name: GitHub Actions CI
description: Generate CI/CD pipeline
output: .github/workflows/ci.yml
context:
  - ./package.json
---

Generate a GitHub Actions CI workflow.

## Pipeline Steps

1. **Lint** - Run ESLint
2. **Type Check** - Run TypeScript compiler
3. **Test** - Run test suite with coverage
4. **Build** - Build the project

## Configuration

- Trigger on push to main and pull requests
- Use Node.js version from package.json engines
- Cache npm dependencies
- Run jobs in parallel where possible
- Fail fast on errors

## Requirements

- Upload coverage reports
- Add status badges
- Use matrix for multiple Node versions if appropriate
