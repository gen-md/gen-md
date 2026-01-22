# git gen

Generate code with git.

```bash
npx gitgen
```

Requires an API key from Anthropic, OpenAI, Google AI, OpenRouter, or AWS Bedrock. See [Setup](#setup).

## Demo

```bash
# Clone any repo
git clone https://github.com/vercel/next.js
cd next.js

# Analyze the codebase (creates .gitgen.md)
npx gitgen learn

# Generate two approaches on separate branches
npx gitgen -b feature/analytics-v1 "add analytics middleware using cookies"
npx gitgen -b feature/analytics-v2 "add analytics middleware using local storage"

# Test each
git checkout feature/analytics-v1 && npm test
git checkout feature/analytics-v2 && npm test

# Merge the better one
npx gitgen merge feature/analytics-v1 feature/analytics-v2 "pick the cleaner implementation"
```

## Commands

| Command | Description |
|---------|-------------|
| `npx gitgen learn` | Analyze repo, create `.gitgen.md` |
| `npx gitgen "feature"` | Generate files for a feature |
| `npx gitgen -b <branch> "feature"` | Create branch, then generate |
| `npx gitgen merge <branches...> "instruction"` | Compare/combine branches |
| `npx gitgen <spec>.gitgen.md` | Generate from spec file |
| `npx gitgen diff <spec>` | Preview generation |
| `npx gitgen init <file>` | Create spec from existing file |

### Options

```
-b <branch>              Create/switch to branch before generating
--dry-run                Preview without making changes
--prompt "instructions"  Add custom instructions
```

## Setup

Set one of these environment variables:

```bash
export ANTHROPIC_API_KEY=sk-...          # Anthropic
export OPENAI_API_KEY=sk-...             # OpenAI
export GOOGLE_GENERATIVE_AI_API_KEY=...  # Google AI
export OPENROUTER_API_KEY=sk-or-...      # OpenRouter (free tier)

# Or AWS Bedrock
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

Override with `GITGEN_PROVIDER` and `GITGEN_MODEL`.

## GitHub Actions

Run gitgen without any local setup using GitHub Actions.

### One-time setup

Add your API key as a GitHub secret at **Settings > Secrets > Actions**:
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, or
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` for Bedrock

Secrets set at the account level work across all your repos.

### Fork & Learn any repo

Copy [`.github/workflows/fork-learn.yml`](.github/workflows/fork-learn.yml) to your repo, then:

1. Go to **Actions > Fork & Learn**
2. Enter a repo like `vercel/next.js`
3. Run workflow

This forks the repo, runs `npx gitgen learn`, and creates a PR with the `.gitgen.md` file.

### Generate features

Copy [`.github/workflows/gen.yml`](.github/workflows/gen.yml) to your repo, then:

1. Go to **Actions > git gen**
2. Enter a feature like "add user authentication"
3. Run workflow

Creates a PR with the generated code.

## Usage

### Compare Branches

```bash
npx gitgen -b feature/cache-redis "add Redis caching"
npx gitgen -b feature/cache-memory "add in-memory cache"

# Pick the better one
npx gitgen merge feature/cache-redis feature/cache-memory "use the faster implementation"
```

### Resolve Conflicts

```bash
git merge feature/user-profile
# CONFLICT: src/api/users.ts

git merge --abort
npx gitgen merge main feature/user-profile "keep both changes, prefer feature for new fields"
```

### Spec Files

```yaml
---
output: README.md
context:
  - ./package.json
  - ./src/index.ts
---

Generate a README with project overview and usage.
```

```bash
npx gitgen README.gitgen.md     # Generate from spec
npx gitgen diff README.gitgen.md # Preview first
npx gitgen init src/utils.ts     # Create spec from file
```

MIT
