---
name: gen-md-claude-code-readme
description: Generate README for gen-md Claude Code plugin with 3 commands and 1 hook
context:
  - "./plugin.json"
  - "./commands/gen-md.md"
  - "./commands/validate.md"
  - "./commands/cascade.md"
  - "./hooks/detect-gen-md.md"
output: README.md
---
<input>
Generate a comprehensive README.md for the gen-md Claude Code plugin.

## Plugin Info
- Name: gen-md
- Version: 0.1.0
- Author: gen-md
- Components: 3 commands, 1 hook, 1 skill reference

## Structure

```
gen-md-claude-code-plugin/
├── plugin.json              # Plugin manifest
├── commands/
│   ├── gen-md.md           # /gen-md - Main generation command
│   ├── validate.md         # /gen-md-validate - Validation command
│   └── cascade.md          # /gen-md-cascade - Show cascade chain
├── hooks/
│   └── detect-gen-md.md    # Auto-detect .gen.md files (file_open event)
└── README.md               # This file (generated)
```

## Commands (3 total)

| Command | Description |
|---------|-------------|
| `/gen-md [file]` | Generate output from .gen.md file using cascading configuration |
| `/gen-md-validate [files...]` | Validate .gen.md files and check dependencies |
| `/gen-md-cascade [file]` | Show cascade chain and merged configuration |

### /gen-md
- **Arguments**: `file` (optional) - Path to .gen.md file (defaults to current file)
- **Process**:
  1. Resolve cascade chain from target upward
  2. Merge configuration (scalars override, arrays dedupe)
  3. Load context files
  4. Load and include skills
  5. Generate output using merged config + <input> block
  6. Write to output path
- **Output**: Generated file, cascade summary, context files list

### /gen-md-validate
- **Arguments**: `files` (optional) - Paths to .gen.md files (defaults to all in workspace)
- **Checks**: Valid YAML, required fields, context files exist, skill files exist, output directory exists
- **Error Codes**: MISSING_CONTEXT, MISSING_SKILL, INVALID_YAML, MISSING_OUTPUT, CIRCULAR_DEP

### /gen-md-cascade
- **Arguments**: `file` (optional) - Path to .gen.md file (defaults to current file)
- **Output**: Chain list (root → leaf), merged frontmatter with source attribution
- **Merge Rules**: Scalars (child overrides), Arrays (concatenate + dedupe), Body (append)

## Hook (1 total)

### detect-gen-md
- **Event**: file_open
- **Pattern**: `**/*.gen.md`
- **Behavior**:
  1. Parse frontmatter
  2. Resolve cascade
  3. Check dependencies
  4. Display summary with 📄 emoji
- **Smart Suggestions**:
  - Outdated output → suggest `/gen-md`
  - Validation errors → suggest `/gen-md-validate`
  - Complex cascade → suggest `/gen-md-cascade`
- **Disable**: Set `plugins.gen-md.autoDetect: false` in `.claude/settings.json`

## Installation

```json
// .claude/plugins.json
{
  "plugins": ["./packages/gen-md-claude-code-plugin"]
}
```

Or copy to `.claude/plugins/gen-md/`

## Include in README

1. Plugin name and description
2. Installation instructions
3. Commands reference table
4. Hook description
5. Example workflow
6. Link to @gen-md/core and @gen-md/cli
7. Link to monorepo README
</input>
