# gitgen

Predictive git.

```
┌──────────────────────────────────────────────────────────────┐
│  git manages what IS.     gitgen explores EVERYTHING ELSE.   │
└──────────────────────────────────────────────────────────────┘
```

```bash
npm install -g gitgen && export ANTHROPIC_API_KEY=sk-...
```

## Quick Start

```bash
$ gitgen branch "add dark mode"

→ Planning: add dark mode
→ Branch: feature/dark-mode
→ Generating files...
  + src/contexts/ThemeContext.tsx
  + src/hooks/useTheme.ts
  + src/components/ThemeToggle.tsx

✓ Created 3 files
```

## Workflows

```
SPEC → FILE              FILE → SPEC              FEATURE → BRANCH

.gitgen.md               README.md                "add dark mode"
    │                        │                          │
    ▼                        ▼                          ▼
 gitgen .                gitgen init              gitgen branch
    │                        │                          │
    ▼                        ▼                          ▼
README.md               README.gitgen.md         feature/dark-mode
                                                 + generated files
```

## Commands

| Command | Description |
|---------|-------------|
| `gitgen .` | Generate from `.gitgen.md` in current directory |
| `gitgen diff .` | Preview changes without writing |
| `gitgen init <file>` | Create spec from file + git history |
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

`output` (required) · `context` (files to include) · `model` (default: claude-sonnet-4-20250514)

MIT
