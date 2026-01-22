# gitgen Examples

Example projects and templates.

## Examples

| Example | Description |
|---------|-------------|
| [01-basic](./01-basic/) | Simple README generation from package.json |
| [oss-templates](./oss-templates/) | .gitgen.md templates for popular OSS projects |

## Quick Start

```bash
# Navigate to example
cd examples/01-basic

# Preview the generation
git gen diff README.gitgen.md

# Generate the file
git gen README.gitgen.md
```

## Creating Specs

Define what you want, gitgen generates it:

```yaml
---
output: README.md
context:
  - ./package.json
---

Generate a README with project overview and usage.
```

## OSS Templates

Pre-made .gitgen.md files for popular repositories:

- **react.gitgen.md** - React library patterns
- **shadcn-ui.gitgen.md** - shadcn/ui component patterns
- **opencode.gitgen.md** - OpenCode CLI patterns
- **claude-code-skills.gitgen.md** - Claude Code plugin patterns

Use these as references when creating specs for similar projects.

## Exploring Alternatives

Generate multiple versions to compare:

```bash
# Generate with different approaches
git gen -b docs/minimal "README with just usage"
git gen -b docs/detailed "comprehensive README with examples"

# Compare and merge
git gen merge docs/minimal docs/detailed "combine: minimal structure, detailed examples"
```
