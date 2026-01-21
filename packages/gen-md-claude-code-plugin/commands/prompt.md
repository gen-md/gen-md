---
name: gen-md-prompt
description: Generate a conversational prompt from a .gen.md file with one-shot examples
arguments:
  - name: file
    description: Path to .gen.md file (defaults to current file)
    required: false
  - name: git
    description: Include git context (--git flag)
    required: false
---

# /gen-md-prompt Command

Generate a conversational prompt from a `.gen.md` file, including one-shot examples from the cascade chain.

## Usage

```
/gen-md-prompt [file] [--git]
```

## Behavior

1. **Resolve cascade chain**: Find all parent .gen.md files
2. **Merge examples**: Collect one-shot examples from all cascade levels
3. **Include current output**: Add current file content as implicit example
4. **Format prompt**: Generate conversational prompt with examples
5. **Add git context**: Optionally include recent commits and changes

## Example Output

```
<one-shot-example>
Generate a README for the core library.
---
# @gen-md/core

Core library for the gen-md framework...
</one-shot-example>

Generate comprehensive documentation for the CLI package.
Include installation, commands reference, and examples.
```

## Options

- `--git`: Include git context (recent commits, branch info)
- `--json`: Output as JSON structure
- `--no-current-code`: Don't include current output file

## Use Cases

- Prepare context for LLM-assisted generation
- Extract examples for few-shot prompting
- Debug prompt construction
