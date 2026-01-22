Analyze this repository and create a .gitgen.md specification that captures its patterns.

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

Create a .gitgen.md that:
1. Describes what this project does based on the files and commits
2. Lists the tech stack and key dependencies
3. Documents coding conventions observed
4. Describes the directory structure
5. Notes patterns for commits, naming, and style
6. Provides guidance for generating new features that match the project's patterns

The output field should be empty (to be filled in per-generation).
Include relevant context files.

Output ONLY the .gitgen.md content, starting with ---.
