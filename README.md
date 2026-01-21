# gitgen

Minimal bridge between git and LLM. Generate files from `.gitgen.md` specs.

```
git manages what IS.
gitgen manages what SHOULD BE.
```

## What is gitgen?

One file = one output. Define what a file should contain in a `.gitgen.md` spec, and gitgen generates it.

```bash
gitgen README.gitgen.md    # Generates README.md
```

## Installation

```bash
npm install -g gitgen
```

Requires `ANTHROPIC_API_KEY` environment variable.

## The Spec Format

```yaml
---
output: README.md
context:
  - ./package.json
  - ./src/index.ts
model: claude-sonnet-4-20250514
---

Generate a README with:
- Project overview
- Installation steps
- Usage examples
```

**Fields:**
- `output` (required): Target file path
- `context`: Files to include as context
- `model`: Claude model to use (default: claude-sonnet-4-20250514)

## Commands

```bash
gitgen <spec.gitgen.md>       # Generate output file
gitgen diff <spec.gitgen.md>  # Preview changes
gitgen --help                 # Show help
```

## Examples

See [examples/](examples/) for complete examples:
- **01-basic**: Simple README generation
- **02-cascade**: Multi-level inheritance
- **03-documentation**: API docs from source
- **04-infrastructure**: Dockerfile and CI/CD
- **05-content**: Blog posts and release notes
- **06-monorepo**: Full monorepo setup

## Philosophy

gitgen is intentionally minimal:
- Single TypeScript file (~200 lines)
- No config files or directories
- Git tracks history (no need for `.gitgen/`)
- One provider (Anthropic Claude)
- Unix philosophy: do one thing well

## License

MIT
