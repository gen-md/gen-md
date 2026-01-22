# gitgen Examples

Example projects demonstrating how to explore the code graph.

## Examples

| Example | Description |
|---------|-------------|
| [01-basic](./01-basic/) | Simple README generation from package.json |

## Quick Start

```bash
# Navigate to example
cd examples/01-basic

# Preview the generation (peek into the graph)
git gen diff README.gitgen.md

# Generate the file (step into the graph)
git gen README.gitgen.md
```

## Creating Specs

A spec is a portal into the code graph. Define what you want, gitgen generates it:

```yaml
---
output: README.md
context:
  - ./package.json
---

Generate a README with project overview and usage.
```

## Exploring Alternatives

Generate multiple versions to compare:

```bash
# Generate with different contexts
git gen -b docs/minimal "README with just usage"
git gen -b docs/detailed "comprehensive README with examples"

# Compare and merge
git gen merge docs/minimal docs/detailed "combine: minimal structure, detailed examples"
```
