---
name: detect-gen-md
event: file_open
pattern: "**/*.gen.md"
description: Auto-detect .gen.md files and provide contextual information
---

# .gen.md File Detection Hook

Automatically triggers when a `.gen.md` file is opened, providing contextual information about the file.

## Trigger

- **Event**: `file_open`
- **Pattern**: `**/*.gen.md`

## Behavior

When a `.gen.md` file is opened:

1. **Parse frontmatter**: Extract configuration from YAML frontmatter
2. **Resolve cascade**: Find parent .gen.md files in the cascade chain
3. **Check dependencies**: Verify context and skill files exist
4. **Display summary**: Show file info in a non-intrusive way

## Information Provided

```
📄 gen-md file detected: README.gen.md

Configuration:
  • Name: gen-md-cli-readme
  • Output: README.md
  • Context: 3 files
  • Skills: 1 file

Cascade Chain:
  .gen.md → packages/.gen.md → packages/gen-md-cli/README.gen.md

Available Commands:
  • /gen-md - Generate output
  • /gen-md-validate - Check dependencies
  • /gen-md-cascade - View full cascade
```

## Quick Actions

The hook suggests relevant commands:
- If output is outdated → suggest `/gen-md`
- If validation errors → suggest `/gen-md-validate`
- If complex cascade → suggest `/gen-md-cascade`

## Configuration

To disable auto-detection, add to `.claude/settings.json`:

```json
{
  "plugins": {
    "gen-md": {
      "autoDetect": false
    }
  }
}
```
