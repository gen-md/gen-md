# git gen

Predictive git. Generate files for features, or generate from specs.

## Philosophy

```
┌──────────────────────────────────────────────────────────────┐
│  git manages what IS.     git gen explores EVERYTHING ELSE.  │
└──────────────────────────────────────────────────────────────┘
```

## Commands

```bash
git gen "feature"              # Generate files for a feature
git gen -b <branch> "feature"  # Create branch, then generate
git gen .                      # Generate from .gitgen.md spec
git gen diff .                 # Preview spec generation
git gen init <file>            # Create spec from existing file
```

## Example: Adding Dark Mode

```bash
$ git gen -b feature/dark-mode "add dark mode"

→ Planning: add dark mode
→ Branch: feature/dark-mode (new)
→ Generating files...
  + src/contexts/ThemeContext.tsx
  + src/hooks/useTheme.ts
  + src/components/ThemeToggle.tsx

✓ Created 3 files
```

### Options

```bash
git gen -b feature/auth "add auth"   # Create branch + generate
git gen "add more features"          # Generate on current branch
git gen --dry-run "add api"          # Preview plan only
```

### Iterative Session

Generate on a branch, then keep adding:

```bash
# 1. Create branch and generate
$ git gen -b feature/auth "add user authentication"

→ Planning: add user authentication
→ Branch: feature/auth (new)
→ Generating files...
  + src/middleware/auth.ts
  + src/routes/auth.ts

✓ Created 2 files

# 2. Add more (no -b needed, uses current branch)
$ git gen "add password reset"

→ Planning: add password reset
→ Generating files...
  + src/routes/reset-password.ts
  + src/email/password-reset.ts

✓ Created 2 files

# 3. Add more
$ git gen "add email verification"

→ Planning: add email verification
→ Generating files...
  + src/services/email-verification.ts

✓ Created 1 file

# 4. Continue with git
$ git add .
$ git commit -m "feat: add user auth with password reset and email verification"
$ git push -u origin feature/auth
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
