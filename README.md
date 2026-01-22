# git gen

Generate code with git.

```bash
# Clone any repo
git clone https://github.com/vercel/next.js
cd next.js

# Learn its patterns
git gen learn

# Generate new features that match
git gen -b feature/analytics "add analytics middleware"
```

## Install

```bash
npm install -g gitgen
```

## Quick Start

```bash
git clone https://github.com/your-org/your-repo
cd your-repo
git gen learn                              # Learn codebase patterns
git gen -b feature/auth "add JWT auth"     # Generate matching code
```

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

## Usage

### Learn and Generate

```bash
git gen learn
# → Analyzing repository...
# → Created .gitgen.md

git gen "add user authentication"
# → Generating files...
#   + src/middleware/auth.ts
#   + src/routes/login.ts
# → Created 2 files
```

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
