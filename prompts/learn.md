You are analyzing a repository to create a comprehensive .gitgen.md specification file.

<repository-analysis>
<tech-stack>{{techStack}}</tech-stack>

<conventions>
Commit style: {{commitStyle}}
Naming patterns:
{{namingPatterns}}
Directory patterns:
{{directoryPatterns}}
</conventions>

<recent-commits>
{{recentCommits}}
</recent-commits>

{{#recentDiffs}}
<recent-diffs>
{{recentDiffs}}
</recent-diffs>
{{/recentDiffs}}

<key-files>
{{keyFiles}}
</key-files>

<file-structure>
{{fileStructure}}
</file-structure>
</repository-analysis>

Create a .gitgen.md file that will help generate new code matching this project's patterns.

THE OUTPUT MUST START WITH THIS EXACT YAML FRONTMATTER FORMAT:
```
---
output:
context:
  - ./package.json
  - ./README.md
  - ./src/main-file.ts
---
```

IMPORTANT: Each context item MUST have a space after the dash: "  - ./file" NOT "  -./file"

THEN WRITE A COMPREHENSIVE MARKDOWN DOCUMENT with these sections:

# [Project Name] - [Brief Description]

## Project Overview
[1-2 paragraphs explaining what the project does]

## Tech Stack
- **Runtime**: [e.g., Node.js with ESM modules]
- **Language**: [e.g., TypeScript (strict mode)]
- [List other key technologies, frameworks, build tools]

## Architecture
[Describe the main modules/components with their file locations and responsibilities. Use subsections like:]

### [Component Name] (`path/to/file.ts`)
[Description of what this component does, key functions, exports]

## Coding Conventions

### File Organization
- [Directory] - [Purpose]

### Naming
- Functions: [convention and examples]
- Types/Interfaces: [convention and examples]
- Files: [convention and examples]
- Constants: [convention and examples]

### Code Style
- [List specific patterns observed in the codebase]

### Commit Style
- [Describe the commit message format used]

## Adding New Features
[Provide clear guidance on how new code should be structured, including:]

1. **[Guideline 1]** - [Explanation]
2. **[Guideline 2]** - [Explanation]
[etc.]

### Example: [Common Task Type]
```typescript
// Show a code example of how to add something new
```

CRITICAL FORMAT RULES:
1. Start with EXACTLY "---" on line 1
2. YAML frontmatter uses "  - " (two spaces, dash, space) for array items - THIS IS CRITICAL
3. Close frontmatter with EXACTLY "---" on its own line
4. Use proper markdown with # headers
5. Be specific - reference actual files, functions, and patterns from the analysis
6. Include code examples where helpful

Output ONLY the .gitgen.md content. No explanation before or after. Start immediately with ---
