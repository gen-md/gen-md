# gitgen

Minimal bridge between git and LLM, and vice versa.

## Philosophy

```
git manages what IS.
gitgen manages what SHOULD BE.
```

One file = one output. Define what a file should contain in a `.gitgen.md` spec, and gitgen generates it.

## Commands

```bash
gitgen .                      # Generate from .gitgen.md in current directory
gitgen <dir>                  # Generate from .gitgen.md in directory
gitgen <spec.gitgen.md>       # Generate from specific spec file
gitgen diff <dir|spec>        # Preview changes without writing
gitgen --help                 # Show help
```

## Spec Format

A `.gitgen.md` file has YAML frontmatter + markdown body:

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

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `output` | Yes | Target file path (relative to spec location) |
| `context` | No | Files to include as context for generation |
| `model` | No | Claude model (default: claude-sonnet-4-20250514) |

## Workflows

### Create a new spec

1. Create `<name>.gitgen.md` or `.gitgen.md` in target directory
2. Add frontmatter with `output` field
3. Write generation instructions in body
4. Run `gitgen <spec>` to generate

### Directory-level specs

Place `.gitgen.md` in a directory, then run:
```bash
gitgen <dir>
```

This pattern works well for:
- Package READMEs in monorepos
- Per-directory documentation
- Component-specific generated files

### Preview before generating

Always preview first with `diff`:
```bash
gitgen diff .
```

Then generate:
```bash
gitgen .
```

## Context Files

Context files are read and included in the LLM prompt. Use them to provide:
- Source code for documentation
- Package.json for project metadata
- Existing files for consistency

Paths are relative to the spec file location.

## Environment

Requires `ANTHROPIC_API_KEY` environment variable.

## Examples

### README from package.json

```yaml
---
output: README.md
context:
  - ./package.json
---
Generate a README with project name, description, installation, and usage.
```

### API docs from source

```yaml
---
output: API.md
context:
  - ./src/api.ts
  - ./src/types.ts
---
Generate API documentation from the source code.
Include all exported functions with their parameters and return types.
```

### Config file generation

```yaml
---
output: tsconfig.json
context:
  - ./package.json
---
Generate a tsconfig.json appropriate for this Node.js project.
Use strict mode and ES modules.
```
