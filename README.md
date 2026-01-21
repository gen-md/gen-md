# gitgen

Predictive git.

```
git manages what IS.
gitgen explores EVERYTHING ELSE.
```

## Quick Start

```bash
# Generate file from spec
gitgen .

# Create spec from existing file (learns from git history)
gitgen init README.md

# Generate feature branch with implementation
gitgen branch "add dark mode"
```

## Install

```bash
npm install -g gitgen
export ANTHROPIC_API_KEY=sk-...
```

## Commands

| Command | Description |
|---------|-------------|
| `gitgen .` | Generate from `.gitgen.md` in current directory |
| `gitgen <dir>` | Generate from `.gitgen.md` in directory |
| `gitgen <spec>` | Generate from specific spec file |
| `gitgen diff <path>` | Preview changes without writing |
| `gitgen init <file>` | Create spec from existing file |
| `gitgen branch <feature>` | Create branch with implementation |

## Spec Format

```yaml
---
output: README.md
context:
  - ./package.json
  - ./src/index.ts
---

Generate a README with project overview and usage.
```

**Fields:**
- `output` — Target file path (required)
- `context` — Files to include as context
- `model` — Claude model (default: claude-sonnet-4-20250514)

## How It Works

**Spec → File** (`gitgen .`)
1. Parse `.gitgen.md` frontmatter + body
2. Read context files
3. Send to Claude
4. Write output

**File → Spec** (`gitgen init`)
1. Read existing file
2. Analyze git history
3. Generate spec that recreates the file

**Feature → Branch** (`gitgen branch`)
1. Analyze repo structure
2. Plan implementation
3. Create branch
4. Generate files

## License

MIT
