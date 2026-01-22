You are analyzing a repository to create a comprehensive .gitgen.md specification file that captures the project's patterns, conventions, and architecture.

<repository-analysis>

<tech-stack>
Detected technologies: {{techStack}}
</tech-stack>

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
Study these diffs to understand coding style, formatting, and patterns:
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

YOUR TASK: Create a .gitgen.md specification that will help generate new code matching this project's established patterns.

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

CRITICAL YAML RULES:
- Each context item MUST have a space after the dash: "  - ./file" NOT "  -./file"
- Use two spaces for indentation, not tabs
- The "output:" field should be empty (it's a template)
- List 3-5 most important context files that define the project

THEN WRITE A COMPREHENSIVE MARKDOWN DOCUMENT:

# [Project Name] - [Brief One-Line Description]

## Project Overview
[1-2 paragraphs explaining what the project does, its main purpose, and key functionality]

## Tech Stack
- **Runtime**: [e.g., Node.js with ESM modules]
- **Language**: [e.g., TypeScript (strict mode)]
- **Build Tool**: [e.g., tsc, esbuild, webpack]
- **Testing**: [e.g., Vitest, Jest]
- [Other key technologies, frameworks]

## Architecture
[Describe the main modules/components]

### [Component Name] (`path/to/file.ts`)
[What this component does, key functions, exports, dependencies]

### [Another Component] (`path/to/another.ts`)
[Description...]

## Coding Conventions

### File Organization
- `src/` - [Purpose]
- `tests/` - [Purpose]
- [Other directories...]

### Naming
- Functions: [convention] (e.g., `camelCase`, examples: `getUserById`, `parseConfig`)
- Types/Interfaces: [convention] (e.g., `PascalCase`, examples: `UserConfig`, `ApiResponse`)
- Files: [convention] (e.g., `kebab-case.ts`, examples: `user-service.ts`)
- Constants: [convention] (e.g., `UPPER_SNAKE_CASE`, examples: `MAX_RETRIES`)

### Code Style
- [Indentation: spaces/tabs, count]
- [Import organization]
- [Error handling patterns]
- [Comment style]
- [Other observed patterns]

### Commit Style
- [Format, e.g., conventional commits: "feat: description"]
- [Examples from recent commits]

## Adding New Features

Guidelines for adding new code that matches project patterns:

1. **[First guideline]** - [Explanation with specific reference to project]
2. **[Second guideline]** - [Explanation]
3. **[Third guideline]** - [Explanation]
[Continue as needed...]

### Example: [Common Task Type in This Project]
```typescript
// Show a realistic code example that demonstrates project patterns
// Use actual naming conventions, imports, and style from the analysis
```

QUALITY REQUIREMENTS:
1. Be SPECIFIC - reference actual file paths, function names, and patterns from the analysis
2. Be ACTIONABLE - provide guidance that helps generate matching code
3. Be ACCURATE - only document patterns you can verify from the provided analysis
4. Include CODE EXAMPLES that demonstrate the project's actual style

CRITICAL OUTPUT RULES:
1. Start with EXACTLY "---" on line 1 (no blank lines before)
2. YAML frontmatter uses "  - " (two spaces, dash, space) for array items
3. Close frontmatter with EXACTLY "---" on its own line
4. Use proper markdown with # headers (not underlines)
5. NO preamble like "Here is the spec:" or "Sure!"
6. NO explanation after the spec

Output ONLY the .gitgen.md content. Start immediately with ---
