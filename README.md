# gitgen

[![npm version](https://badge.fury.io/js/gitgen.svg)](https://www.npmjs.com/package/gitgen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI co-pilot for git workflows.** Declarative file generation that works alongside your existing git practices.

```
git manages what IS.
gitgen manages what SHOULD BE.
```

## What is gitgen?

gitgen generates files from declarative specs (`.gitgen.md` files). You describe what a file should contain, gitgen generates it using any LLM provider.

- Works alongside git, not instead of it
- One spec file = one output file
- Cascading configuration inheritance
- Multi-provider: Anthropic, OpenAI, Ollama (local)
- Full generation history with rollback

## Real Workflow: Feature Branch with Generated Docs

```bash
# Start a feature branch
git checkout -b feature/user-auth

# Create a spec for the module's README
gitgen add src/auth/README.md --description "Auth module documentation"

# Preview what would be generated
gitgen diff src/auth/README.gitgen.md

# Generate the file
gitgen commit -m "Generate auth module docs"

# Commit everything to git
git add -A && git commit -m "Add user authentication with docs"
git push origin feature/user-auth
```

gitgen generates the files. git tracks them. They work together.

## How .gitgen.md Files Are Calculated

Specs inherit from parent directories. Place a `.gitgen.md` anywhere to define defaults for all specs below it.

```
project/
├── .gitgen.md                    # Root: company defaults
├── packages/
│   ├── .gitgen.md                # Package-level defaults
│   └── api/
│       └── README.gitgen.md      # Leaf spec (inherits from both)
```

### Example Cascade

**project/.gitgen.md** (root defaults)
```yaml
---
context:
  - ./package.json
skills:
  - ./.gitgen/skills/company-style.md
model: claude-sonnet-4
---
All documentation follows company standards.
```

**project/packages/.gitgen.md** (package defaults)
```yaml
---
context:
  - ./shared/types.ts
skills:
  - ./.gitgen/skills/api-docs.md
---
Package documentation includes API reference.
```

**project/packages/api/README.gitgen.md** (leaf spec)
```yaml
---
output: README.md
context:
  - ./src/index.ts
---
Generate API documentation with examples.
```

**Resolved configuration:**
```yaml
---
output: README.md
model: claude-sonnet-4                        # Inherited from root
context:                                      # Arrays concatenate + dedupe
  - ./package.json                            # from root
  - ./shared/types.ts                         # from packages/
  - ./src/index.ts                            # from leaf
skills:
  - ./.gitgen/skills/company-style.md         # from root
  - ./.gitgen/skills/api-docs.md              # from packages/
---
All documentation follows company standards.  # root body

Package documentation includes API reference. # packages/ body

Generate API documentation with examples.     # leaf body
```

**Merge rules:**
- Scalars (name, output, model): child overrides parent
- Arrays (context, skills): concatenate and deduplicate
- Body: append (parent first, then child)

Use `gitgen cascade <spec>` to see the full inheritance chain.

## Production Workflows

gitgen works for any git-based production workflow where files can be generated from specs.

### Code Generation
```bash
# Generate README from package.json + source files
gitgen add README.md --description "Project documentation"

# Generate config files
gitgen add tsconfig.json --description "TypeScript config for Node.js library"

# Generate test stubs
gitgen add src/auth/__tests__/login.test.ts --description "Unit tests for login flow"
```

### Documentation
```bash
# API documentation from source
gitgen add docs/api/users.md --description "User API reference"

# Changelog from git history
gitgen add CHANGELOG.md --description "Changelog from recent commits"

# Migration guides
gitgen add docs/migration/v2.md --description "Migration guide from v1 to v2"
```

### Infrastructure
```bash
# Dockerfile from package.json
gitgen add Dockerfile --description "Production Dockerfile for Node.js app"

# CI/CD configuration
gitgen add .github/workflows/ci.yml --description "GitHub Actions CI pipeline"

# Kubernetes manifests
gitgen add k8s/deployment.yaml --description "K8s deployment for production"
```

### Content & Media
```bash
# Blog posts from outlines
gitgen add content/blog/launch-announcement.md --description "Launch blog post"

# Release notes
gitgen add releases/v2.0.0.md --description "Release notes for v2.0.0"

# Translations
gitgen add i18n/es/messages.json --description "Spanish translations"
```

## Installation

```bash
npm install -g gitgen
```

**Requirements:**
- Node.js >= 20.0.0
- API key for your chosen provider (Anthropic, OpenAI, or local Ollama)

## Quick Start

```bash
# Initialize gitgen in your project
gitgen init

# Create a spec
gitgen add README.md --description "Project documentation"

# Preview the generation
gitgen diff README.gitgen.md

# Generate the file
gitgen commit -m "Generate README"
```

## Multi-Provider Support

```bash
# See available providers
gitgen provider list

# Set your default
gitgen config set provider anthropic
gitgen config set model claude-sonnet-4

# Override per-command
gitgen diff README.gitgen.md --provider openai --model gpt-4o
```

**Environment Variables:**
- `ANTHROPIC_API_KEY` - Anthropic Claude models
- `OPENAI_API_KEY` - OpenAI models
- Ollama runs locally, no key needed

## Commands

### Core Workflow

| Command | Description |
|---------|-------------|
| `gitgen init` | Initialize `.gitgen/` directory |
| `gitgen status` | Show status of specs |
| `gitgen diff <spec>` | Preview predicted changes |
| `gitgen add <file>` | Create or stage spec |
| `gitgen commit` | Generate all staged specs |
| `gitgen refine <spec>` | Interactive refinement session |

### History & Rollback

| Command | Description |
|---------|-------------|
| `gitgen log [spec]` | Show generation history |
| `gitgen show <hash>` | View a specific generation |
| `gitgen reset <hash>` | Rollback to previous generation |

### Configuration

| Command | Description |
|---------|-------------|
| `gitgen config get <key>` | Get config value |
| `gitgen config set <key> <value>` | Set config value |
| `gitgen config list` | List all config |
| `gitgen provider list` | Show available providers |
| `gitgen provider models <name>` | List provider's models |

### Utilities

| Command | Description |
|---------|-------------|
| `gitgen cascade <spec>` | Show inheritance chain |
| `gitgen validate [path]` | Validate specs without API |

## Interactive Refinement

The `refine` command opens a chat session where you iterate on generations:

```bash
gitgen refine README.gitgen.md
```

**Session commands:**
| Command | Description |
|---------|-------------|
| `/accept` | Accept current version and save |
| `/reject` | Discard and exit |
| `/back` | Go to previous version |
| `/history` | Show all versions |
| `/diff` | Show diff from original |
| `/model <name>` | Switch model mid-session |
| `/help` | Show all commands |

Type natural language to refine:
- "Make it more concise"
- "Add code examples"
- "Use a friendlier tone"

## The `.gitgen.md` Spec Format

```yaml
---
name: "README Generator"
description: "Project documentation"
output: README.md
context:
  - ./package.json
  - ./src/index.ts
skills:
  - ./.gitgen/skills/docs.md
model: claude-sonnet-4
provider: anthropic
---

Generate comprehensive documentation including:
- Project overview
- Installation steps
- Usage examples
- API reference

<example>
Simple input project
---
# Simple Project

A minimal example.
</example>
```

**Frontmatter fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `output` | Yes | Target file path |
| `name` | No | Human-readable identifier |
| `description` | No | What this generates |
| `context` | No | Files to include as context |
| `skills` | No | Domain knowledge files |
| `model` | No | Override default model |
| `provider` | No | Override default provider |

## The `.gitgen/` Directory

```
.gitgen/
├── config               # Settings (provider, model)
├── HEAD                 # Current branch
├── index                # Staged specs
├── refs/heads/          # Branch refs
├── objects/             # Content-addressed storage
└── logs/                # Generation history
```

## Generation History

Every generation is tracked:

```bash
# View history
gitgen log README.gitgen.md

commit a3f9e2d
Model: claude-sonnet-4
Date: 2024-01-15 10:30:00
Tokens: 1,234 in / 567 out

    Update with new API examples

commit b4k7d3e
Model: gpt-4o
Date: 2024-01-14 15:20:00

    Initial generation

# View specific generation
gitgen show a3f9e2d

# Rollback
gitgen reset b4k7d3e --hard
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT
