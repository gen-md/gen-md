---
name: gen-md-monorepo-readme
description: Generate README.md for the gen-md generative markdown framework monorepo
skills:
  - "./.agent/skills/gen-md/SKILL.md"
context:
  - "./package.json"
  - "./packages/gen-md-core/package.json"
  - "./packages/gen-md-cli/package.json"
  - "./packages/gen-md-vscode/package.json"
  - "./packages/gen-md-chrome-ext/package.json"
  - "./packages/gen-md-claude-code-plugin/plugin.json"
output: README.md
---
<input>
Generate a comprehensive README.md for the gen-md monorepo - a generative markdown framework.

## Project Overview

gen-md provides a standardized way to generate and regenerate files using `.gen.md` configuration files. Key features:
- **Cascading configuration**: .gen.md files inherit settings from parent directories
- **Merge strategies**: Configurable array (concatenate, dedupe, replace) and body (append, prepend, replace) merging
- **Multi-platform support**: CLI, VS Code, Chrome extension, Claude Code plugin

## Monorepo Structure

```
gen-md/
├── packages/
│   ├── gen-md-core/           # @gen-md/core - Core library (parser, resolver, compactor, validator)
│   ├── gen-md-cli/            # @gen-md/cli - Command-line interface
│   ├── gen-md-vscode/         # @gen-md/vscode - VS Code extension
│   ├── gen-md-chrome-ext/     # @gen-md/chrome-ext - Chrome extension for GitHub
│   └── gen-md-claude-code-plugin/ # Claude Code plugin
├── tests/
│   └── e2e/                   # Playwright E2E tests
└── .github/
    └── workflows/             # CI/CD with GitHub Actions
```

## Include in README

1. **Header**: Project name, badges (CI, version 0.1.0, license MIT)
2. **What is gen-md**: Brief explanation of generative markdown concept
3. **Quick Start**: Installation and basic usage example
4. **Packages table**: List all packages with descriptions and npm names
5. **.gen.md File Format**: Frontmatter schema (name, description, context, skills, prompt, output)
6. **Cascading Configuration**: How inheritance works with examples
7. **Development**: npm workspaces commands (build, test, lint, typecheck)
8. **Requirements**: Node.js >= 20.0.0
9. **License**: MIT

Use concise, technical writing. Include code examples where helpful.
</input>
