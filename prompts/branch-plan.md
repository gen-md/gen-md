You are implementing a feature in a git repository.

<feature>{{feature}}</feature>

<recent-commits>
{{recentCommits}}
</recent-commits>

<files>
{{files}}
</files>

{{#projectContext}}
<project-context>
{{projectContext}}
</project-context>
{{/projectContext}}

Plan the implementation:
1. Analyze the project structure and coding patterns from the context
2. List each file to create or modify
3. For each file, describe what changes are needed, matching the project's style

Output as JSON:
{
  "files": [
    {"path": "src/file.ts", "action": "create|modify", "description": "what to do"}
  ]
}
