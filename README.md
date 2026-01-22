# git gen

Generative git.

```bash
npm install -g gitgen && export ANTHROPIC_API_KEY=sk-...
```

## The Git Lifecycle

```
clone → learn → branch → generate → commit → push → merge
```

gitgen augments each step with AI that learns from your codebase.

## 1. Clone & Learn

Take any codebase and understand its patterns:

```bash
git clone https://github.com/company/project
cd project

git gen learn
# → Analyzing repository...
# Tech stack: typescript, react, tailwind
# Patterns: conventional commits, barrel exports, co-located tests
# ✓ Created .gitgen.md
```

The `.gitgen.md` spec captures everything: naming conventions, directory structure, coding patterns.

## 2. Branch & Generate

Create feature branches with AI-generated code that matches existing patterns:

```bash
git gen -b feature/auth "add JWT authentication"
# → Branch: feature/auth (new)
# → Planning: add JWT authentication
# → Generating files...
#   + src/middleware/auth.ts
#   + src/routes/login.ts
#   + src/utils/jwt.ts
# ✓ Created 3 files

git gen "add password reset flow"
# → Generating files...
#   + src/routes/reset-password.ts
#   + src/emails/password-reset.ts
# ✓ Created 2 files
```

## 3. Commit & Push

Standard git workflow — review, commit, push:

```bash
git add .
git commit -m "feat: auth with password reset"
git push -u origin feature/auth
```

## 4. Merge Branches

Intelligently combine work from multiple branches:

```bash
# Select best implementation from competing branches
git gen merge feature/auth-v1 feature/auth-v2 "pick the cleaner implementation"

# Join complementary features
git gen merge feature/auth feature/dashboard "integrate auth with dashboard"

# Preview without applying
git gen merge --dry-run feature/a feature/b "combine these"
```

## Commands

| Command | Description |
|---------|-------------|
| `git gen learn` | Analyze repo, create `.gitgen.md` |
| `git gen "feature"` | Generate files for a feature |
| `git gen -b <branch> "feature"` | Create branch, then generate |
| `git gen merge <branches...> "instruction"` | Combine branches intelligently |
| `git gen .` | Generate from `.gitgen.md` spec |
| `git gen diff .` | Preview spec generation |
| `git gen init <file>` | Create spec from existing file |

### Options

```bash
-b <branch>              Create/switch to branch before generating
--dry-run                Show plan without making changes
--prompt "instructions"  Add custom instructions
-p "instructions"        Short form of --prompt
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

## Providers

Set one environment variable:

| Provider | Variable | Get Key |
|----------|----------|---------|
| Anthropic | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| OpenRouter | `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| AWS Bedrock | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | AWS Console |

Override with `GITGEN_PROVIDER` and `GITGEN_MODEL`.

## GitHub Action

```yaml
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

MIT
