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

Generation instructions go here as plain markdown.
The body content is the prompt - no tags needed.

One-shot examples use <example> blocks:
<example>
input specification
---
output result
</example>
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

## Cascading Configuration

### How Cascading Works

When resolving a `.gen.md` file, the resolver walks up the directory tree collecting parent `.gen.md` files and merges them from root to leaf:

```
/project/.gen.md              → Level 0 (root)
/project/packages/.gen.md     → Level 1
/project/packages/cli/app.gen.md → Level 2 (target)
```

Cascade chain: `[Level 0, Level 1, Level 2]`

### Merge Rules

| Field Type | Merge Behavior |
|------------|----------------|
| Scalars (name, output) | Child overrides parent |
| Arrays (context, skills) | Concatenate and deduplicate |
| Body content | Append child to parent |
| Examples | Concatenate and deduplicate |

### Cascading Patterns

**1. Root-Level Defaults**

Place a `.gen.md` at the project root to define organization-wide standards:

```yaml
---
name: "project-defaults"
skills: ["./skills/gen-md/SKILL.md"]
---
Follow the project style guide. Use consistent terminology.
```

**2. Directory-Level Specialization**

Add `.gen.md` files in subdirectories for domain-specific context:

```yaml
# packages/.gen.md
---
name: "package-defaults"
context: ["./README.md"]
skills: ["package-documentation"]
---
Document the package API. Include installation and usage examples.
```

**3. Overriding Parent Settings**

Child generators can override parent values:

```yaml
# packages/cli/README.gen.md
---
name: "cli-readme"
output: "README.md"
# This will REPLACE parent's output, but MERGE skills arrays
---
```

## CLI Commands

### Core Commands

```bash
# Preview cascade chain
gen-md cascade <file> [--show-merged] [--json]

# Validate .gen.md files
gen-md validate <files...> [--json]

# Merge multiple files
gen-md compact <files...> -o merged.gen.md

# Generate conversational prompt
gen-md prompt <file> [--json]

# Generate PR-ready output
gen-md pr <file> [--title <title>] [--create]
```

### New Flags (All Commands)

**`--prompt`** - Output as conversational prompt format
```bash
gen-md cascade ./README.gen.md --prompt
gen-md validate **/*.gen.md --prompt
gen-md compact *.gen.md --prompt
```

**`--git`** - Include git context (commits, branch info)
```bash
gen-md cascade ./README.gen.md --git
gen-md prompt ./README.gen.md --git --git-commits 10
```

**`--from-pr <number>`** - Use PR as multishot example
```bash
gen-md prompt ./README.gen.md --git --from-pr 123
```

## PR Integration

### PR as Output Structure

gen-md can generate PR-ready output with:
- Conventional commit title
- Structured PR body with summary and changes
- Files to create/modify
- Labels and branch naming

```bash
# Generate PR spec
gen-md pr ./README.gen.md --json

# Output gh CLI command
gen-md pr ./README.gen.md --create
```

### Multishot from PRs

Extract examples from merged PRs for few-shot learning:

```bash
# Use specific PR as example
gen-md prompt ./README.gen.md --from-pr 123

# Auto-fetch recent PRs touching this file
gen-md prompt ./README.gen.md --max-pr-examples 5
```

## One-Shot Examples

### Using Example Blocks

Add examples directly in your `.gen.md` file:

```markdown
---
name: "component-generator"
output: "Button.tsx"
---

<example>
Create a simple button component
---
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
</example>

<example>
Create a button with variants
---
export function Button({ children, variant = "primary", onClick }) {
  const styles = { primary: "bg-blue-500", secondary: "bg-gray-500" };
  return <button className={styles[variant]} onClick={onClick}>{children}</button>;
}
</example>

Generate a React component based on the specification above.
```

### Example Format

Examples use `---` as separator between input and output:

```
<example>
[input/specification]
---
[expected output]
</example>
```

## Merge Strategies

| Strategy | Array Behavior |
|----------|----------------|
| `dedupe` (default) | Concatenate and remove duplicates |
| `concatenate` | Append without deduplication |
| `replace` | Child completely replaces parent |

| Strategy | Body Behavior |
|----------|---------------|
| `append` (default) | Child body appended after parent |
| `prepend` | Child body prepended before parent |
| `replace` | Child body replaces parent |

## Generation Guidelines

### Writing Style

1. **Be concise** - Avoid unnecessary verbosity
2. **Be specific** - Use concrete examples over abstract descriptions
3. **Be consistent** - Maintain terminology and formatting throughout
4. **Be actionable** - Provide clear steps and instructions

### Markdown Conventions

1. Use ATX-style headers (`#`, `##`, `###`)
2. Use fenced code blocks with language identifiers
3. Use tables for structured comparisons
4. Use bullet points for lists, numbered lists for sequences

### Code Examples

1. Always specify the language in fenced code blocks
2. Include comments for non-obvious operations
3. Show complete, runnable examples when possible
4. Use realistic variable names and values

## Quality Standards

### Before Finalizing Output

- [ ] All code examples are syntactically correct
- [ ] Links and references are valid
- [ ] Terminology is consistent throughout
- [ ] No placeholder text remains
- [ ] Formatting renders correctly in markdown
- [ ] Content answers the user's actual needs

## Anti-patterns

### What to Avoid

1. **Generic filler** - Don't add content just to fill space
2. **Excessive hedging** - Avoid "might", "could possibly", "in some cases"
3. **Redundant explanations** - Don't repeat the same information
4. **Over-documentation** - Don't document obvious behavior
5. **Stale examples** - Don't use outdated syntax or deprecated APIs
6. **Inconsistent formatting** - Don't mix formatting styles
7. **Missing context** - Don't assume knowledge the reader doesn't have
8. **Broken references** - Don't reference files or sections that don't exist
9. **Deep nesting without cascading** - Use cascading to flatten complex hierarchies
10. **Duplicate generators** - Use compaction to consolidate similar generators
