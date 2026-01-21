# git gen

Generative git.

```bash
npm install -g gitgen && export ANTHROPIC_API_KEY=sk-...
```

## Example

```bash
$ git gen -b feature/auth "add JWT authentication"

→ Planning: add JWT authentication
→ Branch: feature/auth (new)
→ Generating files...
  + src/middleware/auth.ts
  + src/routes/login.ts
  + src/utils/jwt.ts

✓ Created 3 files

$ git gen "add password reset"

→ Planning: add password reset
→ Generating files...
  + src/routes/reset-password.ts
  + src/emails/password-reset.ts

✓ Created 2 files

$ git add . && git commit -m "feat: auth with password reset" && git push
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
-b <branch>    Create/switch to branch before generating
--dry-run      Show plan without generating files
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
