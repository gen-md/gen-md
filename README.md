# gitgen

Predictive git. Generate specs from git history, and generate new branches for feature implementations.

```
git manages what IS.
gitgen manages what SHOULD BE.
```

## What is gitgen?

gitgen bridges git and LLM in both directions:
- **Spec → File**: Generate files from `.gitgen.md` specs
- **File → Spec**: Generate specs from existing files (learning from git history)
- **Feature → Branch**: Generate entire feature branches from descriptions

```bash
gitgen .                      # Generate from .gitgen.md
gitgen init README.md         # Create spec from existing file
gitgen branch "add dark mode" # Create feature branch
```

## Installation

```bash
npm install -g gitgen
```

Requires `ANTHROPIC_API_KEY` environment variable.

## Commands

```bash
gitgen .                      # Generate from .gitgen.md in current dir
gitgen <dir>                  # Generate from .gitgen.md in directory
gitgen <spec.gitgen.md>       # Generate from specific spec file
gitgen diff <dir|spec>        # Preview changes
gitgen init <file>            # Create .gitgen.md spec from existing file
gitgen branch <feature>       # Create branch with feature implementation
gitgen --help                 # Show help
```

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

## Examples

See [examples/](examples/) for a complete example.

## Philosophy

gitgen is intentionally minimal:
- Single TypeScript file (~400 lines)
- No config files or directories
- Git tracks history (no need for `.gitgen/`)
- One provider (Anthropic Claude)
- Unix philosophy: do one thing well

## License

MIT
