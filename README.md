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

## Cookbooks

### Prototype → Pick Winner

Two devs spike the same feature. Instead of manual review:

```bash
# See what each branch actually does
git log main..feature/search-alice --oneline
git log main..feature/search-bob --oneline

# Let AI compare and pick
git gen merge feature/search-alice feature/search-bob "pick the one with better error handling"
# → Strategy: select
# → Analysis:
#   feature/search-alice: Implements search with try/catch, loading states, debounce
#   feature/search-bob: Basic search, no error handling, faster but fragile
# → Selecting: feature/search-alice
```

### Stale Branch Revival

Found a 3-month-old branch with good work buried in conflicts:

```bash
git checkout main
git pull

# See how bad it is
git diff main...feature/old-notifications --stat
# 47 files changed, massive drift

# Extract the good parts, regenerate for current main
git gen merge feature/old-notifications main "extract notification logic, adapt to current patterns"
# → Strategy: hybrid
# → Extracting notification service from old branch
# → Regenerating UI components for current design system
```

### Feature + Feature = Integration

Auth and dashboard built in parallel. Now they need to talk:

```bash
git log main..feature/auth --oneline
# a]1b2c3 Add JWT middleware
# d4e5f6 Add login/logout routes

git log main..feature/dashboard --oneline
# 7g8h9i Add dashboard layout
# j0k1l2 Add user stats component

# Merge with integration instructions
git gen merge feature/auth feature/dashboard "integrate auth - dashboard should show user info, protect routes"
# → Strategy: join
# → Adding auth context to dashboard
# → Protecting dashboard routes with JWT middleware
# → Displaying user info in header
```

### A/B Implementation Testing

Not sure which approach is better? Generate both:

```bash
git gen -b feature/cache-redis "add Redis caching layer"
git stash && git checkout main

git gen -b feature/cache-memory "add in-memory LRU cache"

# Run benchmarks on each, then merge the winner
npm run bench --branch=feature/cache-redis
npm run bench --branch=feature/cache-memory

git checkout main
git gen merge feature/cache-redis feature/cache-memory "use redis, it performed 3x better in benchmarks"
```

### Onboarding: New Codebase in 10 Minutes

Day 1 at a new job:

```bash
git clone git@company.com:team/main-app.git
cd main-app

# Understand everything
git gen learn
cat .gitgen.md  # Read the patterns

# Your first feature matches existing style automatically
git gen -b feature/my-first-pr "add health check endpoint"
git diff  # Review what it generated

# Confident it matches team conventions
git add . && git commit -m "feat: add health check endpoint"
```

### Rescue Merge Conflicts

Two branches touched the same files. Git can't auto-merge:

```bash
git merge feature/user-profile
# CONFLICT: src/api/users.ts

# Instead of manual resolution:
git merge --abort
git gen merge main feature/user-profile "combine user profile changes with main, prefer feature branch for new fields"
# → Analyzing conflicts in src/api/users.ts
# → Main added: validation middleware
# → Feature added: profile fields (avatar, bio)
# → Resolution: Keep both, apply validation to new fields
```

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
