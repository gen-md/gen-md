---
name: gen-md-core-readme
description: Generate README for the gen-md core library
skills:
  - "../../.agent/skills/gen-md/SKILL.md"
context:
  - "./src/index.ts"
  - "./src/types/index.ts"
  - "./package.json"
output: README.md
---
<input>
Generate a comprehensive README.md for @gen-md/core, the core library of the gen-md framework.

Include:
1. Package name and description
2. Installation instructions (npm install @gen-md/core)
3. API documentation for main exports:
   - GenMdParser - parsing .gen.md files
   - CascadingResolver - resolving cascade chains
   - Compactor - merging multiple .gen.md files
   - Validator - validating .gen.md files
4. Type definitions overview
5. Usage examples for each main feature
6. Link to main project README
</input>
