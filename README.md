# gen-md

gen-md allows you to maintain a <file>.gen.md next to any <file>. A *.gen.md file contains the instructions for rendering / generating <file>. You can generate files from gen files and vice versa.

## Why this is useful


## Quick start

- ``npx gen-md gen <file-or-dir-pattern> <prompt>`` - generate <file>.gen.md files from <file> files
- ``npx gen-md <file-or-dir-pattern> <prompt>`` - generate <file> files from <file>.gen.md files

### Supported environments:
As a Custom GPT / skill (desktop / mobile): ChatGPT, Claude, Gemini, Anthropic etc
As an IDE extension: vscode, Google antigravity, Claude Code, Cursor, Codex, Gemini, Windsurf etc
As a browser extension: Chrome, Firefox, Safari


### Example gen.md setup
Use case: New York Times best seller book planning

```markdown
---
name: book-plan.gen.md
description: Generate core, book plan considering previous versions and updated instructions
context: @book-v1, @book-v2, @book-v3, @book-v4, @book-v5
generates: @book-v6/step-1-core.md, @book-v6/step-2-book-plan.md
skills: @.agent/skills/storyteller/SKILL.md 
---
You are a best selling business book author. You are well versed in the works of Carlota Perez, Geoffrey Moore, and Clayton Christensen and alike, and you apply their theories to the current age of AI, and conjecture about the future of AI and its impact on society in large and the workforce in particular. You are also a bit of a contrarian, and you are not afraid to challenge conventional wisdom. 

```



## License

MIT
