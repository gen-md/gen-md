# git gen

Generate code that matches your codebase patterns.

```bash
npm install -g gitgen && export ANTHROPIC_API_KEY=sk-...
```

## How It Works

1. **Learn** your codebase patterns
2. **Generate** new code that follows them
3. **Merge** branches intelligently

## Usage

### Learn a Codebase

```bash
git gen learn
# → Analyzing repository...
# → Created .gitgen.md
```

Creates a `.gitgen.md` spec capturing your naming conventions, directory structure, and coding patterns.

### Generate Features

```bash
git gen "add JWT authentication"
# → Generating files...
#   + src/middleware/auth.ts
#   + src/routes/login.ts
# → Created 2 files

# Or create a branch first
git gen -b feature/auth "add JWT authentication"
```

### Merge Branches

Compare and combine branches with AI assistance:

```bash
# Pick the better implementation
git gen merge feature/auth-v1 feature/auth-v2 "pick the simpler one"

# Combine complementary features
git gen merge feature/auth feature/dashboard "integrate auth into dashboard"
```

### Generate from Specs

```bash
# Generate from a spec file
git gen README.gitgen.md

# Preview without writing
git gen diff README.gitgen.md

# Create a spec from an existing file
git gen init src/utils.ts
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

## Providers

| Provider | Variable |
|----------|----------|
| Anthropic | `ANTHROPIC_API_KEY` |
| AWS Bedrock | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |

Override with `GITGEN_PROVIDER` and `GITGEN_MODEL`.

## Examples

### Prototype and Compare

```bash
git gen -b feature/cache-redis "add Redis caching"
git gen -b feature/cache-memory "add in-memory cache"

# Test both, then merge the winner
git gen merge feature/cache-redis feature/cache-memory "use redis"
```

### Resolve Merge Conflicts

```bash
git merge feature/user-profile
# CONFLICT: src/api/users.ts

git merge --abort
git gen merge main feature/user-profile "prefer feature branch for new fields"
```

### Onboard to a New Codebase

```bash
git clone git@company.com:team/app.git && cd app
git gen learn
git gen -b feature/my-first-pr "add health check endpoint"
```

MIT
