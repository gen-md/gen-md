---
name: gen-md-claude-code-readme
description: Generate README for Claude Code plugin
skills:
  - "../../.agent/skills/gen-md/SKILL.md"
context:
  - "./plugin.json"
  - "./commands/gen-md.md"
  - "./commands/validate.md"
  - "./commands/cascade.md"
  - "./hooks/detect-gen-md.md"
output: README.md
---
<input>
Generate a comprehensive README.md for the gen-md Claude Code plugin.

## Structure

This is a Claude Code plugin with the following structure:
```
gen-md-claude-code-plugin/
├── plugin.json              # Plugin manifest
├── commands/
│   ├── gen-md.md           # /gen-md - Main generation command
│   ├── validate.md         # /gen-md-validate - Validation command
│   └── cascade.md          # /gen-md-cascade - Show cascade chain
├── hooks/
│   └── detect-gen-md.md    # Auto-detect .gen.md files
└── README.md               # This file (generated)
```

## Required Sections

1. **Header**: Plugin name "gen-md" with tagline about generative markdown

2. **Features**:
   - `/gen-md` - Generate output from .gen.md file with cascading config
   - `/gen-md-validate` - Validate .gen.md files and dependencies
   - `/gen-md-cascade` - Preview cascade chain and merged config
   - Auto-detection of .gen.md files with contextual info

3. **Installation**:
   - Clone/copy plugin to `.claude/plugins/gen-md/`
   - Or reference via `.claude/plugins.json`
   ```json
   {
     "plugins": ["./packages/gen-md-claude-code-plugin"]
   }
   ```

4. **Commands Reference**:
   Document each slash command with:
   - Command syntax
   - Description
   - Example usage
   - Expected output

5. **Cascading Configuration**:
   - Explain how .gen.md files inherit from parent directories
   - Show example cascade chain
   - Document merge rules (scalars override, arrays dedupe)

6. **Integration with gen-md Ecosystem**:
   - Link to @gen-md/core for programmatic API
   - Link to @gen-md/cli for command-line usage
   - Link to main project README
   - Reference shared SKILL.md for generation context

7. **Example Workflow**:
   ```
   1. Create feature.gen.md with frontmatter
   2. Run /gen-md to generate output
   3. Use /gen-md-validate to check dependencies
   4. Use /gen-md-cascade to debug inheritance
   ```

Keep the README concise but comprehensive. Use tables for command reference.
</input>
