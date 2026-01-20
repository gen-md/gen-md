---
name: gen-md-vscode-readme
description: Generate README for @gen-md/vscode - VS Code extension with syntax highlighting, commands, and hover providers
context:
  - "./package.json"
  - "./src/extension.ts"
  - "./src/commands/index.ts"
  - "./src/providers/validation.ts"
  - "./src/providers/hover.ts"
  - "./syntaxes/gen-md.tmLanguage.json"
output: README.md
---
<input>
Generate a README.md for the gen-md VS Code extension.

## Extension Info
- Name: @gen-md/vscode
- Display Name: gen-md
- Version: 0.1.0
- VS Code Engine: ^1.85.0
- Publisher: gen-md

## Commands (4 total)

| Command | Title | Description |
|---------|-------|-------------|
| `gen-md.generate` | Generate from .gen.md | Resolve cascade and generate output |
| `gen-md.validate` | Validate .gen.md files | Validate single file or all in workspace |
| `gen-md.showCascade` | Show Cascade Chain | Visual webview of cascade chain |
| `gen-md.compact` | Compact .gen.md files | Merge multiple files via file picker |

## Providers

1. **GenMdValidationProvider** - Diagnostic validation
   - Listens to text document events
   - Creates VS Code diagnostics for errors/warnings
   - Publishes to "gen-md" diagnostic collection

2. **GenMdHoverProvider** - Hover information
   - Shows cascade chain preview (first 20 lines)
   - Displays merged skills, context count, output file
   - Quick link to showCascade command

## Language Support

- Language ID: `gen-md`
- File extensions: `.gen.md`
- Syntax highlighting: TextMate grammar with gen-md specific keywords
  - Keywords highlighted: name, description, context, skills, prompt, output
  - YAML frontmatter support
  - Input block (`<input>`) support

## Configuration Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `gen-md.validateOnSave` | boolean | true | Validate .gen.md files on save |
| `gen-md.showCascadeOnHover` | boolean | true | Show cascade chain on hover |

## Context Menus

- Editor context: "Generate from .gen.md" (when .gen.md file open)
- Explorer context: "Validate .gen.md files" (when .gen.md file selected)

## Activation Events

- `onLanguage:gen-md`
- `workspaceContains:**/*.gen.md`

## Include in README

1. Extension name and marketplace installation
2. Features list with screenshots placeholders
3. Commands table
4. Settings table
5. Language features
6. Link to @gen-md/core for programmatic usage
7. Link to monorepo README
</input>
