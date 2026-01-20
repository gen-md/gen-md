---
name: gen-md-cli-readme
description: Generate README for the gen-md CLI
skills:
  - "../../.agent/skills/gen-md/SKILL.md"
context:
  - "./bin/gen-md.ts"
  - "./src/commands/index.ts"
  - "./package.json"
output: README.md
---
<input>
Generate a comprehensive README.md for @gen-md/cli, the command-line interface for gen-md.

Include:
1. Package name and description
2. Installation instructions (npm install -g @gen-md/cli or npx gen-md)
3. Complete command reference:
   - gen: Generate file from .gen.md
   - init: Initialize .gen.md for directory
   - infer: Infer .gen.md from existing file
   - compact: Merge multiple .gen.md files
   - cascade: Preview cascade chain
   - validate: Validate .gen.md files
4. Common usage patterns and examples
5. Configuration options
6. Link to main project README
</input>
