# git gen

Generative git.

```bash
npm install -g gitgen && export ANTHROPIC_API_KEY=sk-...
```

Uses git's [extension mechanism](https://git-scm.com/docs/git#_git_commands) — installing adds `git-gen` to PATH, which git discovers as `git gen`.

## Why git?

Git history is an implicit style guide. Recent commits show naming conventions, file organization, error patterns. The file tree reveals architecture — where routes go, where utils live. Related files in the same directory show local patterns.

Generation reads this context: `git log` for patterns, `git ls-files` for structure, sibling files for style. New code matches *your* codebase, not generic examples.

The workflow stays familiar: branch → generate → review → commit → push.

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

## GitHub Action

Generate directly from GitHub without local setup:

```yaml
# .github/workflows/gen.yml
on:
  workflow_dispatch:
    inputs:
      feature:
        description: 'Feature to generate'
        required: true

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 20
      - uses: gitgen/gitgen@main
        with:
          feature: ${{ inputs.feature }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

Trigger via GitHub UI (Actions → Run workflow) or CLI:

```bash
gh workflow run gen.yml -f feature="add user authentication"
```

MIT
