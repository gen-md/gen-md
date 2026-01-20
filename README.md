# gen-md

**gen-md** is a generative markdown framework that lets you define how files are generated using simple `.gen.md` prompts. It provides a standardized way to generate and regenerate files based on context, templates, and skills.

## Why gen-md

Stop writing code for content generation. Instead, groom and cascade in-codebase knowledge for content generation, expansion, and verification. gen-md generates any type of content in a consistent and repeatable manner, from simple markdown files to complex codebases, using natural language.

## Features

- **File-Specific Prompts**: Each `.gen.md` file describes how to generate its corresponding file.
- **Metadata-Driven**: Use a simple metadata header to define name, description, context, and skills.
- **Context and Skills**: Reference other files or reusable skill modules to enrich the generation process.
- **Git-Aware Generation**: Incorporate Git history to create more informed, contextual prompts.
- **Cascading Context**: Define global `.gen.md` files in parent folders to apply common patterns across multiple files.

## The `.gen.md` File Format

A `.gen.md` file is a markdown file with YAML frontmatter that controls generation:

```markdown
---
name: "Generator Name"
description: "What this generator produces"
context: ["./path/to/context.file"]
skills: ["skill-name", "./path/to/SKILL.md"]
prompt: $prompt
output: "output-filename.ext"
---

<input>
Generation instructions go here.
$prompt
</input>
```

**Frontmatter Fields:**
| Field | Description |
|-------|-------------|
| `name` | Human-readable identifier for the generator |
| `description` | Brief explanation of what gets generated |
| `context` | Array of file paths to include as context |
| `skills` | Array of skill references (by name or path) |
| `prompt` | Variable placeholder for dynamic input |
| `output` | The target output filename |

## Monorepo Structure

```
packages/
  cli/          - Command-line interface
  core/         - Core library and base skill
  vscode/       - VS Code extension
  chrome/       - Chrome extension
```

## Getting Started

Install and use the gen-md CLI via npx:

```bash
# Initialize a new repo
npx gen-md init .          # Creates .gen.md file for the current directory
npx gen-md infer .         # Infers .gen.md file for the current directory

# Work with existing files
npx gen-md gen README.md   # Generates README.md from README.md.gen.md
npx gen-md infer README.md # Infers README.md.gen.md from README.md
```

## Platform Support

**AI Assistants** (desktop/mobile):
- ChatGPT, Claude, Gemini

**IDE Extensions**:
- VS Code, Google IDX, Claude Code, Cursor, Windsurf

**Browser Extensions**:
- Chrome, Firefox, Safari

## Advanced Usage

* **Git-Enhanced Prompts**: gen-md can incorporate Git commit history to refine the generation prompts, making the output more contextual.
* **Cascading Configurations**: Place a `.gen.md` file in a directory to provide default rules for all files in that directory.

## Contributing

Soon.

## License

This project is licensed under the MIT License.
