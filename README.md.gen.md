
---
name: README.md.gen.md
description: Generate README.md for a monrepo for a generative markdown framework
skills: ./agent/skills/gen-md/SKILL.md
prompt: $prompt
output: README.md
---
<input>
Generate README.md for a monrepo for a generative markdown framework project that lets you control how files are generated using `.gen.md` prompt files. It provides a standardized way to generate and regenerate files based on context, templates, and skills. The monorepo implements the base skill, cli, and support for target platfroms (chrome extension, vscode extension, etc.) under the @packages folder.
$prompt
</input>

