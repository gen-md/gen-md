You are implementing a feature in a git repository.

<feature>{{feature}}</feature>

<recent-commits>
{{recentCommits}}
</recent-commits>

{{#recentDiffs}}
<recent-diffs>
{{recentDiffs}}
</recent-diffs>
{{/recentDiffs}}

<files>
{{files}}
</files>

{{#projectContext}}
<project-context>
{{projectContext}}
</project-context>
{{/projectContext}}

Plan the implementation:
1. Study the recent diffs to understand coding patterns, naming conventions, and style
2. Analyze the project structure from the file list and context
3. List each file to create or modify
4. For each file, describe what changes are needed, matching the project's established patterns

Output as JSON:
{
  "files": [
    {"path": "src/file.ts", "action": "create|modify", "description": "what to do"}
  ]
}
