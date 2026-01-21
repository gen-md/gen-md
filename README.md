# gitgen

Minimal bridge between git and LLM, and vice versa. Generate files from `.gitgen.md` specs.

```
git manages what IS.
gitgen manages what SHOULD BE.
```

## What is gitgen?

One file = one output. Define what a file should contain in a `.gitgen.md` spec, and gitgen generates it.

```bash
gitgen .                   # Uses .gitgen.md in current directory
gitgen src/                # Uses src/.gitgen.md
gitgen README.gitgen.md    # Uses specific spec file
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
gitgen .                      # Generate from .gitgen.md in current dir
gitgen <dir>                  # Generate from .gitgen.md in directory
gitgen <spec.gitgen.md>       # Generate from specific spec file
gitgen diff <dir|spec>        # Preview changes
gitgen --help                 # Show help
```

## Examples

See [examples/](examples/) for a complete example.

## Philosophy

gitgen is intentionally minimal:
- Single TypeScript file (~200 lines)
- No config files or directories
- Git tracks history (no need for `.gitgen/`)
- One provider (Anthropic Claude)
- Unix philosophy: do one thing well

## License

MIT
