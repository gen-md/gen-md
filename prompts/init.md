Analyze this file and its git history to create a .gitgen.md spec that could regenerate it.

<file path="{{filePath}}">
{{fileContent}}
</file>

{{#history}}
<git-history>
{{history}}
</git-history>
{{/history}}

Create a .gitgen.md spec with:
1. YAML frontmatter with output: {{fileName}} and relevant context files
2. Clear instructions that capture what this file should contain
3. Any patterns or rules evident from the git history

Output ONLY the .gitgen.md content, starting with ---.
