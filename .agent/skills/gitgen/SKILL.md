# git gen

Predictive git. Generate specs from git history, and generate new branches for feature implementations.

## Philosophy

```
┌──────────────────────────────────────────────────────────────┐
│  git manages what IS.     git gen explores EVERYTHING ELSE.  │
└──────────────────────────────────────────────────────────────┘
```

## Three Workflows

```
SPEC → FILE              FILE → SPEC              FEATURE → BRANCH

.gitgen.md               README.md                "add dark mode"
    │                        │                          │
    ▼                        ▼                          ▼
 git gen .              git gen init             git gen branch
    │                        │                          │
    ▼                        ▼                          ▼
README.md               README.gitgen.md         feature/dark-mode
                                                 + generated files
```

## Commands

```bash
git gen .                      # Generate from .gitgen.md in current directory
git gen <dir>                  # Generate from .gitgen.md in directory
git gen <spec.gitgen.md>       # Generate from specific spec file
git gen diff <dir|spec>        # Preview changes without writing
git gen init <file>            # Create .gitgen.md spec from existing file
git gen branch <feature>       # Create branch with feature implementation
```

## Example: Adding Dark Mode

```bash
$ git gen branch "add dark mode"

→ Planning: add dark mode
→ Branch: feature/dark-mode
→ Generating files...
  + src/contexts/ThemeContext.tsx
  + src/hooks/useTheme.ts
  + src/components/ThemeToggle.tsx

✓ Created 3 files
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
$ git gen .

→ Generating: README.md
✓ Wrote README.md
```

### Create spec from existing file

```bash
$ git gen init README.md

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
$ git gen diff .

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
