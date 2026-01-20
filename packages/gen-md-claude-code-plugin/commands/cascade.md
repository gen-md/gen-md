---
name: gen-md-cascade
description: Show cascade chain and merged configuration for a .gen.md file
arguments:
  - name: file
    description: Path to .gen.md file (defaults to current file)
    required: false
---

# /gen-md-cascade Command

Display the cascade chain and merged configuration for debugging inheritance.

## Usage

```
/gen-md-cascade [file]
```

## Output

Shows the complete cascade resolution:

1. **Chain**: List of all .gen.md files in the cascade (root → leaf)
2. **Merged Config**: Final merged frontmatter after applying all cascade rules
3. **Merge Details**: Which values came from which file

## Example Output

```
Cascade Chain for: packages/gen-md-cli/README.gen.md

Chain (3 files):
  1. .gen.md (project root)
     └─ skills: [".agent/skills/gen-md/SKILL.md"]

  2. packages/.gen.md
     └─ skills: [+ inherits 1 skill]
     └─ context: ["./package.json"]

  3. packages/gen-md-cli/README.gen.md (target)
     └─ name: "gen-md-cli-readme"
     └─ output: "README.md"
     └─ context: [+ "./src/index.ts", "./bin/gen-md.ts"]

Merged Configuration:
  name: "gen-md-cli-readme"
  skills:
    - ".agent/skills/gen-md/SKILL.md"  (from: .gen.md)
  context:
    - "./package.json"                  (from: packages/.gen.md)
    - "./src/index.ts"                  (from: target)
    - "./bin/gen-md.ts"                 (from: target)
  output: "README.md"                   (from: target)
```

## Merge Rules Reference

| Type | Rule | Example |
|------|------|---------|
| Scalars | Child overrides parent | `name: "child"` replaces `name: "parent"` |
| Arrays | Concatenate + deduplicate | `skills: [a]` + `skills: [b]` → `[a, b]` |
| Body | Append child to parent | Parent body + child body |

## Use Cases

- Debug why a skill or context file isn't being included
- Understand configuration inheritance
- Verify cascade chain is resolved correctly
- Check which parent contributes which values
