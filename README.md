# git gen

Generative git.

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

```bash
npm install -g gitgen && export ANTHROPIC_API_KEY=sk-...
```

## Commands

| Command | Description |
|---------|-------------|
| `git gen "feature"` | Generate files for a feature |
| `git gen -b <branch> "feature"` | Create branch, then generate |
| `git gen .` | Generate from `.gitgen.md` spec |
| `git gen diff .` | Preview spec generation |
| `git gen init <file>` | Create spec from existing file |

### Options

```bash
git gen -b feature/auth "add auth"   # Create branch + generate
git gen "add more features"          # Generate on current branch
git gen --dry-run "add api"          # Preview plan only
```

### Iterative Session

```bash
git gen -b feature/auth "add auth"   # 1. Create branch + generate
git gen "add password reset"         # 2. Add more (current branch)
git gen "add email verification"     # 3. Add more
git add . && git commit && git push  # 4. Continue with git
```

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
