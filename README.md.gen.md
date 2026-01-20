
---
name: README.md.gen.md
description: Generate README.md for a monrepo for a generative markdown framework
output: README.md
---
<one-shot-example>
<input>
Generate README.md for a monrepo for a generative markdown framework project that lets you control how files are generated using `.gen.md` prompt files. It provides a standardized way to generate and regenerate files based on context, templates, and skills. The monorepo implements the base skill, cli, and support for target platfroms (chrome extension, vscode extension, etc.) under the @packages folder.
ultrathink
</input>
<output>
# gen-md

**gen-md** is a generative markdown framework that lets you define how files are generated using simple `.gen.md` prompts. It provides a standardized way to generate and regenerate files based on context, templates, and skills.

## Why this is useful
Stop wrting code,instead, groome and cascade in-codbase knowledge for content generation, expansion and verification. gen-md can generate any type of content in a consistent and repeatable manner, from simple markdown files to complex codebases, using natural language.  

## Target supported platfroms
As a Custom GPT / skill (desktop / mobile): ChatGPT, Claude, Gemini, Anthropic etc
As an IDE extension: vscode, Google antigravity, Claude Code, Cursor, Codex, Gemini, Windsurf etc
As a browser extension: Chrome, Firefox, Safari


## Features

- **File-Specific Prompts**: Each `.gen.md` file describes how to generate its corresponding file.  
- **Metadata-Driven**: Use a simple metadata header to define name, description, context, and skills.  
- **Context and Skills**: Reference other files or reusable skill modules to enrich the generation process.  
- **Git-Aware Generation**: Incorporate Git history to create more informed, contextual prompts.  
- **Cascading Context**: Define global `.gen.md` files in parent folders to apply common patterns across multiple files.

## Getting Started

1. **Installation**:  
   Install the gen-md CLI via npm:  
```bash
# for a new repo
npx gen-md init . #creates .gen.md file for the current directory 
npx gen-md infer . #infers .gen.md file for the current directory and related .gen.md files

#for an existing file
npx gen-md gen README.md #generates README.md < README.md.gen.md
npx gen-md infer README.md #infers README.md.gen.md < README.md
```

2. **Creating a `.gen.md` File**:
   Add a `.gen.md` file next to any file you want to generate. For example:

   ```markdown
   ---
   name: "Example Generator"
   description: "Generates a sample markdown file"
   context: ["./data/info.json"]
   skills: ["common-templates", "markdown-boilerplate"]
   ---

   # Hello, World!

   This is a generated file based on the context and skills provided.
   ```

3. **Running the Generator**:
   Use the CLI to generate files:

   ```bash
   gen-md generate path/to/file.md
   ```

   Or create a `.gen.md` from an existing file:

   ```bash
   gen-md infer path/to/existing-file.md
   ```

## Advanced Usage

* **Git-Enhanced Prompts**: gen-md can incorporate Git commit history to refine the generation prompts, making the output more contextual.
* **Cascading Configurations**: Place a `.gen.md` file in a directory to provide default rules for all files in that directory.

## Contributing

Soon.

## License

This project is licensed under the MIT License.
</output>
</one-shot-example>

