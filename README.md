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
| `git gen learn` | Analyze repo, create `.gitgen.md` |

### Options

```bash
-b <branch>    Create/switch to branch before generating
--dry-run      Show plan without generating files
```

## Providers

gitgen supports multiple LLM providers. Set one of these environment variables:

| Provider | Environment Variable | Get Key |
|----------|---------------------|---------|
| Anthropic (default) | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| OpenRouter | `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| AWS Bedrock | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | AWS Console |

Auto-detection order: Bedrock → OpenRouter → Anthropic

### Override Provider

```bash
export GITGEN_PROVIDER=openrouter  # Force specific provider
export GITGEN_MODEL=llama          # Model alias or full ID
```

Model aliases by provider:
- **Anthropic/Bedrock**: `claude-sonnet` (default), `claude-opus`, `claude-haiku`
- **OpenRouter**: `llama` (default, free), `gemini` (free), `qwen` (free)

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

`output` (required) · `context` (files to include) · `model` (override default)

## Learn Command

Analyze your repository and generate a `.gitgen.md` spec that captures its patterns:

```bash
$ git gen learn

→ Analyzing repository...
Tech stack: node, typescript, react
Commit style: conventional
Files: 42
→ Generating spec...
✓ Created .gitgen.md
```

The generated spec includes:
- Tech stack detection
- Commit message patterns
- Naming conventions
- Directory structure
- Key configuration files

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
      provider:
        description: 'LLM Provider'
        type: choice
        options: [anthropic, bedrock, openrouter]
        default: anthropic

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
          provider: ${{ inputs.provider }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          openrouter-api-key: ${{ secrets.OPENROUTER_API_KEY }}
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

Add your provider's secrets to repository settings, then trigger via GitHub UI (Actions → Run workflow) or CLI:

```bash
gh workflow run gen.yml -f feature="add user authentication" -f provider=anthropic
```

MIT
