# gitgen

Predictive git. Generate specs from git history, and generate new branches for feature implementations.

## Philosophy

```
git manages what IS.
gitgen explores EVERYTHING ELSE.
```

gitgen bridges git and LLM in both directions:
- **Spec → File**: Generate files from `.gitgen.md` specs
- **File → Spec**: Generate specs from existing files (learning from git history)
- **Feature → Branch**: Generate entire feature branches from descriptions

## Commands

```bash
gitgen .                      # Generate from .gitgen.md in current directory
gitgen <dir>                  # Generate from .gitgen.md in directory
gitgen <spec.gitgen.md>       # Generate from specific spec file
gitgen diff <dir|spec>        # Preview changes without writing
gitgen init <file>            # Create .gitgen.md spec from existing file
gitgen branch <feature>       # Create branch with feature implementation
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

### Generate from spec

```bash
gitgen .                      # Use .gitgen.md in current dir
gitgen src/                   # Use src/.gitgen.md
gitgen README.gitgen.md       # Use specific spec file
```

### Create spec from existing file

```bash
gitgen init README.md         # Creates README.gitgen.md
gitgen init src/config.ts     # Creates src/config.gitgen.md
```

The `init` command:
1. Reads the existing file content
2. Analyzes git history for patterns
3. Generates a .gitgen.md spec that could recreate the file

### Generate feature branch

```bash
gitgen branch "add user authentication"
gitgen branch "implement dark mode toggle"
gitgen branch "add REST API for products"
```

The `branch` command:
1. Analyzes repo structure and recent commits
2. Plans which files to create/modify
3. Creates a new git branch
4. Generates all files with implementation

### Preview before generating

```bash
gitgen diff .
gitgen diff README.gitgen.md
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
