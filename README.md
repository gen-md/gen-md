# gen-md

**Gen-md is a git-like MCP for predictive version control using `.gen.md` specs.**

Like git manages versions of files, gen-md manages **predicted versions** of files. The natural I/O is git-like operations - checkout, diff, branch, status - but operating on predicted/generated content rather than committed history.

## The Concept

```bash
git checkout feature/add-auth     # Checks out existing branch
gen-md checkout feature/add-auth  # Predicts what this branch WOULD contain
```

The `.gen.md` files become the "specs" that define what content should exist. Gen-md predicts file contents based on:
1. The .gen.md spec (the "what should be generated")
2. Current codebase context (the "what exists now")
3. Git history (the "how things evolved")
4. Cascading inheritance (the "conventions to follow")

## Installation

```bash
npm install -g gen-md
```

**Requirements:**
- Node.js >= 20.0.0
- `ANTHROPIC_API_KEY` environment variable (for content generation)

## Quick Start

```bash
# Initialize a gen-md repository
gen-md init

# Check status of .gen.md specs
gen-md status

# Create a spec for an existing file
gen-md add README.md --description "Project documentation"

# See what would be generated (preview diff)
gen-md diff README.gen.md --dry-run

# Generate the content (requires ANTHROPIC_API_KEY)
gen-md diff README.gen.md

# Stage and commit (regenerate all staged specs)
gen-md add README.gen.md
gen-md commit -m "Update README"
```

## Commands

### `gen-md init [path]`
Initialize a gen-md repository by creating the `.gen-md/` directory.

```bash
gen-md init
gen-md init ./my-project
```

### `gen-md status`
Show status of `.gen.md` specs - which need regeneration, which are up to date.

```bash
gen-md status
gen-md status --json
```

Output shows:
- **staged**: Specs ready for commit
- **modified**: Specs that changed since last generation
- **new**: Specs with missing output files

### `gen-md diff <spec>`
Show difference between current file and predicted content from spec.

```bash
# Generate prediction and show diff (calls Anthropic API)
gen-md diff README.gen.md

# Include git context in prediction
gen-md diff README.gen.md --git

# Preview without API call
gen-md diff README.gen.md --dry-run

# Use cached prediction
gen-md diff README.gen.md --cached
```

### `gen-md add <file>`
Create a `.gen.md` spec for an existing file, or stage an existing spec for commit.

```bash
# Create spec for existing file
gen-md add README.md --description "Project documentation"

# Stage an existing spec
gen-md add README.gen.md
```

### `gen-md commit`
Regenerate all staged specs and write output files.

```bash
gen-md commit -m "Update documentation"
gen-md commit --git          # Include git context
gen-md commit --dry-run      # Preview without writing
```

## The `.gen.md` File Format

A `.gen.md` file is a markdown file with YAML frontmatter:

```markdown
---
name: "README Generator"
description: "Generate project documentation"
context:
  - "./package.json"
  - "./src/index.ts"
output: "README.md"
---

Generate comprehensive documentation for this project.

Include:
- Project description
- Installation instructions
- Usage examples
- API documentation
```

**Frontmatter Fields:**
| Field | Description |
|-------|-------------|
| `name` | Human-readable identifier |
| `description` | What gets generated |
| `context` | File paths to include as context |
| `skills` | Skill references (for cascading) |
| `output` | Target output filename |

## The `.gen-md/` Directory

Gen-md maintains state in a `.gen-md/` directory (like `.git/`):

```
.gen-md/
├── HEAD                      # Current branch
├── config                    # Configuration
├── index                     # Staged specs
├── refs/heads/               # Branches
├── objects/                  # Cached predictions
└── logs/                     # Generation history
```

## Cascading Configuration

Place a `.gen.md` file in any directory to define defaults that cascade to all generators in subdirectories:

```
project/
  .gen.md                    # Root config
  packages/
    .gen.md                  # Package defaults
    cli/
      app.gen.md            # Inherits from both
```

**Merge Rules:**
- Scalar values: child overrides parent
- Arrays (context, skills): concatenate and deduplicate
- Body: append child to parent

## MCP Server

Gen-md includes an MCP server for AI agent integration:

```bash
# Start the MCP server
gen-md mcp
```

**Available Tools:**
- `gen_md_init` - Initialize repository
- `gen_md_status` - Show spec status
- `gen_md_diff` - Show predicted diff
- `gen_md_add` - Create/stage specs
- `gen_md_commit` - Regenerate and write

Configure in your MCP client:
```json
{
  "mcpServers": {
    "gen-md": {
      "command": "gen-md",
      "args": ["mcp"]
    }
  }
}
```

## Example Workflow

```bash
# Initialize
gen-md init

# Create a spec for your README
gen-md add README.md --description "Project documentation"

# Edit the generated spec to add more instructions
# (the .gen.md file was created)

# Preview what would be generated
gen-md diff README.gen.md --dry-run

# Generate the content
gen-md diff README.gen.md

# Commit the generation
gen-md add README.gen.md
gen-md commit -m "Generate initial README"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required for content generation |

## License

MIT
