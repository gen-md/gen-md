---
name: gen-md-validate
description: Validate .gen.md files and check dependencies
arguments:
  - name: files
    description: Paths to .gen.md files (defaults to all in workspace)
    required: false
---

# /gen-md-validate Command

Validate `.gen.md` files and verify all referenced dependencies exist.

## Usage

```
/gen-md-validate [files...]
```

## Validation Checks

### Frontmatter Validation
- Valid YAML syntax
- Required fields present (name or description recommended)
- Valid output path specified

### Context File Validation
- All files in `context` array exist
- Paths resolve correctly (relative to .gen.md location)
- Files are readable

### Skill File Validation
- All files in `skills` array exist
- Skill files contain valid content

### Output Validation
- Output directory exists or can be created
- No circular dependencies

## Example Output

```
Validating 3 .gen.md files...

✓ packages/gen-md-core/README.gen.md
  - 2 context files found
  - 1 skill file loaded
  - Output: README.md

✓ packages/gen-md-cli/README.gen.md
  - 3 context files found
  - 1 skill file loaded
  - Output: README.md

✗ packages/gen-md-vscode/README.gen.md
  - Error: Context file not found: ./src/missing.ts
  - Warning: Output file already exists

Summary: 2 passed, 1 failed
```

## Options

- Validate single file: `/gen-md-validate path/to/file.gen.md`
- Validate all: `/gen-md-validate` (scans workspace for *.gen.md)
- Validate multiple: `/gen-md-validate file1.gen.md file2.gen.md`

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_CONTEXT` | Context file does not exist |
| `MISSING_SKILL` | Skill file does not exist |
| `INVALID_YAML` | Frontmatter YAML is malformed |
| `MISSING_OUTPUT` | No output path specified |
| `CIRCULAR_DEP` | Circular dependency detected |
