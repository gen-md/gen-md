# gitgen

**Predictive git.**

```
┌──────────────────────────────────────────────────────────────┐
│  git manages what IS.     gitgen explores EVERYTHING ELSE.   │
└──────────────────────────────────────────────────────────────┘
```

## Install

```bash
npm install -g gitgen
export ANTHROPIC_API_KEY=sk-...
```

---

## The Flow: Adding Dark Mode

You want to add dark mode to your app.

### With git (manual)

```bash
$ git checkout -b feature/dark-mode
Switched to a new branch 'feature/dark-mode'

# Now you:
# 1. Research dark mode patterns
# 2. Create theme context
# 3. Add CSS variables
# 4. Update components
# 5. Test everything
```

### With gitgen (predictive)

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

---

## git vs gitgen

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  UNDERSTANDING HISTORY                                              │
│  ─────────────────────                                              │
│  git log README.md              gitgen init README.md               │
│  (shows what changed)           (learns WHY it changed)             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CREATING BRANCHES                                                  │
│  ─────────────────                                                  │
│  git checkout -b feature/x      gitgen branch "add feature x"       │
│  (empty branch)                 (branch + implementation)           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PREVIEWING CHANGES                                                 │
│  ──────────────────                                                 │
│  git diff                       gitgen diff .                       │
│  (shows current changes)        (shows FUTURE changes)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

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

---

## Commands

| Command | Description |
|---------|-------------|
| `gitgen .` | Generate from `.gitgen.md` in current directory |
| `gitgen <dir>` | Generate from `.gitgen.md` in directory |
| `gitgen <spec>` | Generate from specific spec file |
| `gitgen diff <path>` | Preview changes without writing |
| `gitgen init <file>` | Create spec from existing file + git history |
| `gitgen branch <feature>` | Create branch with implementation |

---

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
- `output` — Target file (required)
- `context` — Files to include as context
- `model` — Claude model (default: claude-sonnet-4-20250514)

---

## License

MIT
