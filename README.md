# git gen

Generate code with git.

```bash
git gen
```

Requires an API key from Anthropic, OpenAI, Google AI, OpenRouter, or AWS Bedrock. See [Setup](#setup).

## Demo

```bash
# Clone any repo
git clone https://github.com/vercel/next.js
cd next.js

# Analyze the codebase
git gen learn
# → Analyzing repository...
# → Created .gitgen.md

# Generate two approaches on separate branches
git gen -b feature/analytics-v1 "add analytics middleware using cookies"
git gen -b feature/analytics-v2 "add analytics middleware using local storage"

# Test each
git checkout feature/analytics-v1 && npm test
git checkout feature/analytics-v2 && npm test

# Merge the better one
git gen merge feature/analytics-v1 feature/analytics-v2 "pick the cleaner implementation"
```

### What `learn` creates

The `.gitgen.md` file captures your project's patterns:

```markdown
---
context:
  - ./package.json
  - ./src/index.ts
---
# next.js - React framework for production

## Tech Stack
- Runtime: Node.js
- Language: TypeScript
- Testing: Jest

## Coding Conventions
- Functions: camelCase
- Files: kebab-case.ts
- 2-space indentation

## Adding New Features
1. Add route in pages/ or app/
2. Follow existing component patterns
3. Include tests in __tests__/
```

This spec tells gitgen how to generate code that matches your codebase.

## Commands

| Command | Description |
|---------|-------------|
| `git gen learn` | Analyze repo, create `.gitgen.md` |
| `git gen "feature"` | Generate files for a feature |
| `git gen -b <branch> "feature"` | Create branch, then generate |
| `git gen merge <branches...> "instruction"` | Compare/combine branches |
| `git gen <spec>.gitgen.md` | Generate from spec file |
| `git gen diff <spec>` | Preview generation |
| `git gen init <file>` | Create spec from existing file |

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

### Running commands

Copy [`.github/workflows/gitgen.yml`](.github/workflows/gitgen.yml) to your repo, then:

1. Go to **Actions > gitgen**
2. Select a command and fill in the required fields
3. Run workflow

| Command | Description | Required fields |
|---------|-------------|-----------------|
| `generate` | Generate feature code | feature |
| `learn` | Analyze repo, create .gitgen.md | - |
| `merge` | Combine branches | merge_branches, feature (instruction) |
| `init` | Create spec from file | spec |
| `diff` | Preview spec generation | spec |
| `fork-learn` | Fork repo and learn | repo (owner/repo) |

All commands create a PR with the changes (except `diff` which previews only).

## Usage

### Compare Branches

```bash
git gen -b feature/cache-redis "add Redis caching"
git gen -b feature/cache-memory "add in-memory cache"

# Pick the better one
git gen merge feature/cache-redis feature/cache-memory "use the faster implementation"
```

### Resolve Conflicts

```bash
git merge feature/user-profile
# CONFLICT: src/api/users.ts

git merge --abort
git gen merge main feature/user-profile "keep both changes, prefer feature for new fields"
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
git gen README.gitgen.md     # Generate from spec
git gen diff README.gitgen.md # Preview first
git gen init src/utils.ts     # Create spec from file
```

MIT
