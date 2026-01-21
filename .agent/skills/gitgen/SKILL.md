# gitgen

Predictive git. Generate specs from git history, and generate new branches for feature implementations.

## Philosophy

```
┌──────────────────────────────────────────────────────────────┐
│  git manages what IS.     gitgen explores EVERYTHING ELSE.   │
└──────────────────────────────────────────────────────────────┘
```

## Three Workflows

```
SPEC → FILE              FILE → SPEC              FEATURE → BRANCH
───────────              ───────────              ─────────────────

.gitgen.md               README.md                "add dark mode"
    │                        │                          │
    ▼                        ▼                          ▼
┌───────┐               ┌────────┐                ┌──────────┐
│gitgen │               │ gitgen │                │  gitgen  │
│   .   │               │  init  │                │  branch  │
└───────┘               └────────┘                └──────────┘
    │                        │                          │
    ▼                        ▼                          ▼
README.md               .gitgen.md               feature/dark-mode
                                                 + generated files
```

## Commands

```bash
gitgen .                      # Generate from .gitgen.md in current directory
gitgen <dir>                  # Generate from .gitgen.md in directory
gitgen <spec.gitgen.md>       # Generate from specific spec file
gitgen diff <dir|spec>        # Preview changes without writing
gitgen init <file>            # Create .gitgen.md spec from existing file
gitgen branch <feature>       # Create branch with feature implementation
```

## Example: Adding Dark Mode

```bash
$ gitgen branch "add dark mode"

→ Planning: add dark mode
→ Branch: feature/dark-mode
→ Generating files...
  + src/contexts/ThemeContext.tsx
  + src/hooks/useTheme.ts
  + src/components/ThemeToggle.tsx
  + src/styles/themes.css

✓ Created 4 files
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

## Workflow Details

### Generate from spec

```bash
$ gitgen .

→ Generating: README.md
✓ Wrote README.md
```

### Create spec from existing file

```bash
$ gitgen init README.md

→ Analyzing: README.md
→ Reading git history...
✓ Wrote README.gitgen.md
```

The `init` command:
1. Reads the existing file content
2. Analyzes git history for patterns
3. Generates a .gitgen.md spec that could recreate the file

### Preview before generating

```bash
$ gitgen diff .

→ Generating: README.md
--- README.md (current)
+++ README.md (generated)
```

## Context Files

Context files are read and included in the LLM prompt. Use them to provide:
- Source code for documentation
- Package.json for project metadata
- Existing files for consistency

Paths are relative to the spec file location.

## Environment

Requires `ANTHROPIC_API_KEY` environment variable.
