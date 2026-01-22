You are creating a .gitgen.md specification file by analyzing an existing file and its git history.

<file path="{{filePath}}">
{{fileContent}}
</file>

{{#history}}
<git-history>
These commits show how the file evolved over time:
{{history}}
</git-history>
{{/history}}

Create a .gitgen.md specification that could be used to regenerate this file.

THE OUTPUT MUST START WITH THIS EXACT YAML FRONTMATTER FORMAT:
```
---
output: {{fileName}}
context:
  - ./related-file-1.ts
  - ./related-file-2.ts
---
```

IMPORTANT: Each context item MUST have a space after the dash: "  - ./file" NOT "  -./file"

THEN WRITE CLEAR INSTRUCTIONS that capture:
1. What this file does and its purpose
2. The structure and organization of the content
3. Any patterns visible from the git history (what gets updated, how, when)
4. Specific formatting rules or conventions
5. Dependencies on other files (list these in context)

GUIDELINES FOR THE SPEC:
- Be specific enough to regenerate the file accurately
- Reference actual patterns from the file content
- Include any constraints or rules that must be followed
- Note any dynamic parts that change vs static parts

CRITICAL FORMAT RULES:
1. Start with EXACTLY "---" on line 1
2. YAML frontmatter uses "  - " (two spaces, dash, space) for context array items
3. Close frontmatter with EXACTLY "---" on its own line
4. Then write markdown instructions
5. NO code fences around the entire output

Output ONLY the .gitgen.md content. No explanation before or after. Start immediately with ---
