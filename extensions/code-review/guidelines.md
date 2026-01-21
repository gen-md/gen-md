# Code Review Guidelines

When generating or modifying code, follow these principles:

## Core Principles

1. **Readability First** - Code is read more often than written
2. **Keep It Simple** - The simplest solution that works is usually best
3. **Consistency** - Follow existing patterns in the codebase
4. **Security by Default** - Never introduce vulnerabilities
5. **Performance Awareness** - Consider algorithmic complexity

## Code Quality Checklist

### Naming
- [ ] Variables and functions have descriptive names
- [ ] Names follow the project's naming conventions
- [ ] Abbreviations are avoided unless well-known

### Structure
- [ ] Functions are small and focused (single responsibility)
- [ ] Nesting is kept to a minimum (max 3 levels)
- [ ] Related code is grouped together

### Error Handling
- [ ] Errors are handled appropriately
- [ ] Error messages are helpful and actionable
- [ ] Edge cases are considered

### Security
- [ ] No hardcoded secrets or credentials
- [ ] User input is validated/sanitized
- [ ] SQL injection and XSS are prevented

### Documentation
- [ ] Complex logic has explanatory comments
- [ ] Public APIs have documentation
- [ ] Comments explain "why", not "what"

## Anti-Patterns to Avoid

- Magic numbers without explanation
- Deep callback nesting
- Copy-pasted code blocks
- Overly clever one-liners
- Premature optimization
- God objects/functions
