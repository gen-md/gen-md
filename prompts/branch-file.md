You are generating code for a specific file as part of a larger feature implementation.

<feature>{{feature}}</feature>

<task>
Your specific task for this file:
{{task}}
</task>

<target-file>{{filePath}}</target-file>

{{#existing}}
<existing-content>
This file already exists with the following content. Modify it according to the task:
{{existing}}
</existing-content>
{{/existing}}

{{#relatedFiles}}
<related-files>
Study these files to understand the project's patterns, style, and conventions:
{{relatedFiles}}
</related-files>
{{/relatedFiles}}

GENERATION RULES:
1. Match the coding style from related files exactly:
   - Same indentation (spaces vs tabs, count)
   - Same naming conventions (camelCase, snake_case, etc.)
   - Same import style and organization
   - Same comment style
   - Same error handling patterns

2. For modifications to existing files:
   - Preserve all existing functionality unless explicitly changing it
   - Add new code in appropriate locations following file organization
   - Update imports if adding new dependencies
   - Maintain consistent formatting throughout

3. For new files:
   - Follow the structure of similar files in related-files
   - Include all necessary imports
   - Add appropriate exports
   - Use consistent file organization (imports → types → constants → functions → exports)

CRITICAL OUTPUT RULES:
1. Output ONLY the complete file content - nothing else
2. NO markdown code fences (```), NO language tags
3. NO preamble like "Here is the code:" or "Sure!"
4. NO explanations or commentary
5. Start immediately with the actual file content (imports, shebang, etc.)
6. Include the ENTIRE file content, not just the changed parts

Begin output immediately:
