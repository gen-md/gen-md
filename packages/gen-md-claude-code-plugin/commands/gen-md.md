---
name: gen-md
description: Generate output from a .gen.md file using cascading configuration
arguments:
  - name: file
    description: Path to .gen.md file (defaults to current file)
    required: false
skills:
  - "../../../.agent/skills/gen-md/SKILL.md"
---

# /gen-md Command

Generate content from a `.gen.md` file with full cascading configuration support.

## Usage

```
/gen-md [file]
```

## Behavior

1. **Resolve cascade chain**: Walk up from the target file's directory to find all parent `.gen.md` files
2. **Merge configuration**: Combine frontmatter using merge rules (scalars override, arrays dedupe)
3. **Load context files**: Read all files listed in the merged `context` array
4. **Load skills**: Include all skill files from the merged `skills` array
5. **Generate output**: Use the merged configuration and `<input>` block to generate content
6. **Write to output**: Save generated content to the path specified in `output` field

## Cascade Resolution

The command automatically resolves the cascade chain:

```
/project/.gen.md              → Base project config
/project/packages/.gen.md     → Package-level defaults
/project/packages/cli/app.gen.md → Target file
```

Merged result inherits from all ancestors.

## Example

Given `feature.gen.md`:
```yaml
---
name: feature-docs
description: Generate feature documentation
skills:
  - "../../.agent/skills/gen-md/SKILL.md"
context:
  - "./src/feature.ts"
output: FEATURE.md
---
<input>
Generate comprehensive documentation for this feature.
Include API reference, usage examples, and configuration options.
</input>
```

Running `/gen-md feature.gen.md` will:
1. Resolve cascade chain from parent directories
2. Merge skills and context arrays
3. Read context files
4. Generate FEATURE.md using the instructions

## Output

- Generated file written to the `output` path
- Summary of cascade chain used
- List of context files included
