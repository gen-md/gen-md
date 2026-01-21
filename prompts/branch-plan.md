You are implementing a feature in a git repository.

<feature>{{feature}}</feature>

<recent-commits>
{{recentCommits}}
</recent-commits>

<files>
{{files}}
</files>

Plan the implementation:
1. List each file to create or modify
2. For each file, describe what changes are needed

Output as JSON:
{
  "branch": "feature/short-name",
  "files": [
    {"path": "src/file.ts", "action": "create|modify", "description": "what to do"}
  ]
}
