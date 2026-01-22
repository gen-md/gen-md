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
| `git gen fork <repo>` | Fork repo, analyze, create PR |
| `git gen test` | Run all tests |
| `git gen test --e2e` | Run E2E tests with screenshots |

### Options

```bash
-b <branch>              Create/switch to branch before generating
--dry-run                Show plan without generating files
--prompt "instructions"  Add custom instructions to any command
-p "instructions"        Short form of --prompt
```

## Custom Prompts

Every command supports `--prompt` for iterative control:

```bash
# Learn with specific focus
git gen learn --prompt "focus on React component patterns"

# Generate with constraints
git gen "add user dashboard" --prompt "use shadcn/ui components, no external state"

# Init with style guidance
git gen init src/api/users.ts --prompt "emphasize error handling patterns"

# Diff with specific requirements
git gen diff . --prompt "include JSDoc comments"
```

This enables iterative workflows where you refine output through successive prompts.

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

### Custom Learning

Focus the analysis with custom prompts:

```bash
# Focus on specific patterns
git gen learn --prompt "focus on API route patterns and middleware"

# Emphasize certain conventions
git gen learn --prompt "emphasize TypeScript strict mode patterns"
```

## Fork Workflow

Contribute `.gitgen.md` specs to public repositories:

```bash
$ git gen fork facebook/react

→ Forking facebook/react...
→ Changed to react/
→ Created branch: gitgen-spec
→ Analyzing repository...
Tech stack: javascript, react
Commit style: conventional
Files: 2847
→ Generating spec...
✓ Created .gitgen.md
→ Committed .gitgen.md
→ Pushed to origin/gitgen-spec
→ Creating pull request...
✓ Pull request created!

✓ Fork workflow complete!

Your fork: https://github.com/yourname/react
Branch: gitgen-spec

Next steps:
1. Review the generated .gitgen.md
2. Test with: git gen "add a feature"
3. Submit the PR to facebook/react
```

### Requirements

The fork command requires the [GitHub CLI](https://cli.github.com):

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
sudo apt install gh
```

Authenticate with `gh auth login` before using.

### Fork via GitHub Actions

Use the provided workflow to fork and analyze repos without local setup:

1. Copy `.github/workflows/fork-learn.yml` to your repo
2. Add secrets: `OPENROUTER_API_KEY` (or other provider keys)
3. Trigger via Actions UI or CLI:

```bash
gh workflow run fork-learn.yml -f repo="owner/repo"
```

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

## Example Repositories

Browse repos with `.gitgen.md` specs to see gitgen in action:

- Search GitHub: [`filename:.gitgen.md`](https://github.com/search?q=filename%3A.gitgen.md&type=code)
- Fork any repo with `git gen fork owner/repo` to try it yourself

## Workflow Examples

### New Feature Development

```bash
# Start fresh branch and generate
git gen -b feature/dark-mode "add dark mode toggle"

# Iterate with custom instructions
git gen "improve dark mode" --prompt "add system preference detection"

# Preview changes
git gen diff .
```

### Contributing to Open Source

```bash
# Fork and learn a project
git gen fork expressjs/express

# Review the generated spec
cat .gitgen.md

# Generate a feature matching their patterns
git gen "add rate limiting middleware" --prompt "follow existing middleware patterns"
```

### Team Onboarding

```bash
# Generate project spec for new team members
git gen learn --prompt "include onboarding tips for new developers"

# New team members can generate code matching team patterns
git gen "add new API endpoint" --prompt "follow team conventions"
```

## Testing

gitgen includes a built-in test runner for comprehensive testing with screenshot support:

```bash
# Run all tests
git gen test

# Run specific test types
git gen test --unit            # Unit tests only
git gen test --e2e             # All E2E tests (CLI + web)
git gen test --cli             # CLI E2E tests only
git gen test --web             # Playwright web tests only

# Generate GitHub Actions workflow
git gen test --workflow
```

### Test Types

| Type | Framework | Description |
|------|-----------|-------------|
| Unit | Vitest | Fast isolated tests for core functions |
| CLI E2E | Vitest | End-to-end tests for CLI commands |
| Web E2E | Playwright | Browser tests with screenshot capture |

### Screenshots in CI

E2E tests automatically capture screenshots and upload them as GitHub Actions artifacts:

```yaml
# Screenshots uploaded to:
# Actions → Run → Artifacts → playwright-screenshots
```

Screenshots are captured at key states during tests and retained for 30 days.

### Running Tests Locally

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm test

# Run with API key for integration tests
OPENROUTER_API_KEY=... npm run test:e2e:cli
```

MIT
