# gen-md Content Generation Skill

## Overview

This skill provides guidance for generating content using the gen-md framework. It defines standards for creating `.gen.md` prompt files and generating high-quality, consistent output across different file types.

## Core Concepts

### The `.gen.md` Format

A `.gen.md` file is a markdown file with YAML frontmatter that defines how to generate its corresponding output file:

```markdown
---
name: "Generator Name"
description: "What this generator produces"
context: ["./path/to/context.file"]
skills: ["skill-name", "./path/to/SKILL.md"]
prompt: $prompt
output: "output-filename.ext"
---

<input>
Generation instructions go here.
$prompt
</input>
```

**Frontmatter Fields:**
- `name` - Human-readable identifier for the generator
- `description` - Brief explanation of what gets generated
- `context` - Array of file paths to include as context
- `skills` - Array of skill references (by name or path)
- `prompt` - Variable placeholder for dynamic input
- `output` - The target output filename

### Skills vs Context

- **Skills**: Reusable instruction sets that define *how* to generate content (patterns, guidelines, standards)
- **Context**: Specific data or files that provide *what* to include in the generation (source files, data, configurations)

## Generation Guidelines

### Writing Style

1. **Be concise** - Avoid unnecessary verbosity; every sentence should add value
2. **Be specific** - Use concrete examples over abstract descriptions
3. **Be consistent** - Maintain terminology and formatting throughout
4. **Be actionable** - Provide clear steps and instructions users can follow

### Markdown Conventions

1. Use ATX-style headers (`#`, `##`, `###`)
2. Use fenced code blocks with language identifiers
3. Use tables for structured comparisons
4. Use bullet points for lists, numbered lists for sequences
5. Keep line lengths reasonable for readability
6. Use blank lines to separate logical sections

### Code Examples

1. Always specify the language in fenced code blocks
2. Include comments for non-obvious operations
3. Show complete, runnable examples when possible
4. Use realistic variable names and values

## Common Patterns

### README Generation

When generating README files:

1. **Start with the project name** as an H1 header
2. **Lead with value** - Explain what the project does and why it matters in the first paragraph
3. **Include quick start** - Provide the fastest path to using the project
4. **Structure consistently**:
   - Overview/Description
   - Features
   - Installation/Getting Started
   - Usage Examples
   - Configuration (if applicable)
   - Contributing
   - License

### Monorepo Documentation

For monorepo projects:

1. Document the overall structure in the root README
2. Reference package-specific documentation
3. Explain the relationship between packages
4. Provide workspace-level commands

Example structure section:
```
packages/
  cli/          - Command-line interface
  core/         - Core library
  vscode/       - VS Code extension
  chrome/       - Chrome extension
```

### Cascading Generation

Use directory-level `.gen.md` files to:
- Define common patterns for all files in a directory
- Set default context that applies to child generators
- Establish consistent naming conventions

## Quality Standards

### Before Finalizing Output

- [ ] All code examples are syntactically correct
- [ ] Links and references are valid
- [ ] Terminology is consistent throughout
- [ ] No placeholder text remains
- [ ] Formatting renders correctly in markdown
- [ ] Content answers the user's actual needs

### Terminology Consistency

Maintain consistent terminology within a project:
- Choose one term and use it throughout (e.g., "generator" not mixing with "template")
- Define abbreviations on first use
- Match the project's existing conventions

## Anti-patterns

### What to Avoid

1. **Generic filler** - Don't add content just to fill space
2. **Excessive hedging** - Avoid "might", "could possibly", "in some cases"
3. **Redundant explanations** - Don't repeat the same information in different words
4. **Over-documentation** - Don't document obvious behavior
5. **Stale examples** - Don't use outdated syntax or deprecated APIs
6. **Inconsistent formatting** - Don't mix formatting styles
7. **Missing context** - Don't assume knowledge the reader doesn't have
8. **Broken references** - Don't reference files or sections that don't exist
