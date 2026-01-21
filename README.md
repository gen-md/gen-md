# gitgen

[![npm version](https://badge.fury.io/js/gitgen.svg)](https://www.npmjs.com/package/gitgen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Git for AI-generated content.** Version control for what SHOULD BE.

```
git manages what IS.
gitgen manages what SHOULD BE.
```

GitGen brings the full power of version control—staging, history, rollback—to AI-powered file generation with **interactive refinement**.

## The Killer Feature: Interactive Refinement

```bash
$ gitgen refine README.gitgen.md
Generating initial version...

Preview:
───────────────────────────────────
# My Project
A CLI tool for...
───────────────────────────────────

You: Make the description more exciting
Regenerating...

Preview:
───────────────────────────────────
# My Project
The ultimate CLI tool that revolutionizes...
───────────────────────────────────

You: /accept
✓ Saved to README.md
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
# Initialize gitgen
gitgen init

# Create a spec for a file
gitgen add README.md --description "Project documentation"

# Interactive refinement (the magic!)
gitgen refine README.gitgen.md

# Or generate directly
gitgen commit -m "Generate docs"
```

## Multi-Provider Support

GitGen works with any LLM provider:

```bash
# See available providers
gitgen provider list

Available Providers

✓ anthropic    (claude-opus-4, claude-sonnet-4, claude-3-5-haiku...)
✓ openai       (gpt-4o, gpt-4o-mini, gpt-4-turbo...)
✓ ollama       (llama3, codellama, mistral...)

# Set your default
gitgen config set provider anthropic
gitgen config set model claude-sonnet-4

# Or specify per-command
gitgen diff README.gitgen.md --provider openai --model gpt-4o
```

**Environment Variables:**
- `ANTHROPIC_API_KEY` - For Anthropic Claude models
- `OPENAI_API_KEY` - For OpenAI models
- Ollama runs locally, no API key needed

## Commands

### Core Workflow

| Command | Description |
|---------|-------------|
| `gitgen init` | Initialize `.gitgen/` directory |
| `gitgen status` | Show status of specs |
| `gitgen diff <spec>` | Preview predicted changes |
| `gitgen add <file>` | Create or stage spec |
| `gitgen commit` | Generate all staged specs |
| `gitgen refine <spec>` | **Interactive refinement session** |

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
| `gitgen watch` | Auto-regenerate on changes |

## Interactive Refinement

The `refine` command opens an interactive session where you can iterate with the AI:

```bash
gitgen refine README.gitgen.md
```

**Session Commands:**
| Command | Description |
|---------|-------------|
| `/accept` | Accept current version and save |
| `/reject` | Discard and exit |
| `/back` | Go to previous version |
| `/history` | Show all versions |
| `/diff` | Show diff from original |
| `/model <name>` | Switch model mid-session |
| `/provider <name>` | Switch provider mid-session |
| `/help` | Show all commands |

Just type natural language to refine:
- "Make it more concise"
- "Add more code examples"
- "Use a friendlier tone"

## The `.gitgen.md` Spec Format

```markdown
---
name: "README Generator"
description: "Project documentation"
output: README.md
context:
  - ./package.json
  - ./src/index.ts
skills:
  - ./.gitgen/skills/docs.md
model: claude-sonnet-4      # Optional: override default
provider: anthropic         # Optional: override default
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

**Frontmatter Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `output` | Yes | Target file path |
| `name` | No | Human-readable identifier |
| `description` | No | What this generates |
| `context` | No | Files to include as context |
| `skills` | No | Domain knowledge files |
| `model` | No | Override default model |
| `provider` | No | Override default provider |

## Cascading Configuration

Place a `.gitgen.md` in any directory to define defaults:

```
project/
├── .gitgen.md              # Root: company standards
├── packages/
│   ├── .gitgen.md          # Package defaults
│   └── api/
│       └── README.gitgen.md  # Inherits from both
```

**Merge Rules:**
- Scalars (name, output, model): Child overrides parent
- Arrays (context, skills): Concatenate and deduplicate
- Body: Append child to parent

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

Every generation is tracked and can be viewed or restored:

```bash
# View history
$ gitgen log README.gitgen.md

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
$ gitgen show a3f9e2d

# Reset to previous
$ gitgen reset b4k7d3e --hard
Reset README.md to generation b4k7d3e
```

## Example Workflows

### Generate Documentation

```bash
gitgen init
gitgen add README.md --description "Project docs"
gitgen refine README.gitgen.md
# Iterate until happy, then /accept
```

### Review and Iterate

```bash
# See what would change
gitgen diff README.gitgen.md

# Don't like it? Refine interactively
gitgen refine README.gitgen.md

# Happy? Commit it
gitgen add README.gitgen.md
gitgen commit -m "Update docs"
```

### Rollback a Bad Generation

```bash
# See history
gitgen log README.gitgen.md

# Preview what you'd restore
gitgen show abc123

# Restore it
gitgen reset abc123 --hard
```

### Use Different Models

```bash
# Quick draft with fast model
gitgen diff README.gitgen.md --model claude-3-5-haiku

# Polish with powerful model
gitgen refine README.gitgen.md --model claude-opus-4

# Try a different provider
gitgen refine README.gitgen.md --provider openai --model gpt-4o
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT
