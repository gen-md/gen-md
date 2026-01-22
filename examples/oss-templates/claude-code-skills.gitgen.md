---
output:
context:
  - ./skills/SKILL.md
  - ./commands/
  - ./agents/
  - ./.claude-plugin/plugin.json
---
# Claude Code Skills Plugin - Create AI agent skills for Claude Code

## Project Overview
This is a Claude Code plugin that adds skills (specialized knowledge and capabilities) to the Claude Code CLI. Skills are markdown files that provide context-specific guidance, examples, and workflows that Claude can use when helping with coding tasks.

## Tech Stack
- **Format**: Markdown with YAML frontmatter
- **Runtime**: Claude Code plugin system
- **Structure**: .claude-plugin/plugin.json manifest

## Architecture

### Plugin Structure
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── commands/                 # Slash commands
│   └── my-command.md
├── agents/                   # Specialized subagents
│   └── my-agent.md
├── skills/                   # Auto-activating skills
│   └── skill-name/
│       └── SKILL.md
└── hooks/
    └── hooks.json
```

### Skill Format
```markdown
---
name: Skill Name
description: When Claude should use this skill
version: 1.0.0
---

# Skill Title

## Overview
What this skill helps with.

## Guidelines
Step-by-step guidance for Claude.

## Examples
Code examples and patterns.

## Best Practices
Do's and don'ts.
```

## Coding Conventions

### File Organization
- `skills/[skill-name]/SKILL.md` - Each skill in its own directory
- `commands/[name].md` - Slash commands users can invoke
- `agents/[name].md` - Specialized subagents for tasks
- `hooks/hooks.json` - Event handlers

### Skill Writing
- Clear, actionable guidance
- Include code examples
- Cover common edge cases
- Progressive disclosure (basics first, advanced later)
- Reference other skills when relevant

### Command Format
```markdown
---
name: command-name
description: What this command does
arguments:
  - name: arg1
    description: First argument
    required: true
---

Instructions for Claude when this command is invoked.
```

### Agent Format
```markdown
---
description: Agent specialty and when to use
capabilities:
  - Specific capability 1
  - Specific capability 2
tools:
  - Bash
  - Read
  - Write
---

System prompt and instructions for the agent.
```

## Adding New Skills

1. **Create skill directory** - `skills/my-skill/`
2. **Add SKILL.md** - Required file with frontmatter
3. **Write clear description** - Helps Claude know when to activate
4. **Include examples** - Real code patterns
5. **Test activation** - Verify skill triggers appropriately
6. **Add related commands** - If skill needs user invocation

### Example Skill: API Design

```markdown
---
name: REST API Design
description: Use when designing or implementing REST APIs
version: 1.0.0
---

# REST API Design Skill

## HTTP Methods
- GET: Retrieve resources (idempotent)
- POST: Create resources
- PUT: Replace resources (idempotent)
- PATCH: Partial updates
- DELETE: Remove resources (idempotent)

## URL Patterns
- `/resources` - Collection
- `/resources/:id` - Single resource
- `/resources/:id/subresources` - Nested resources

## Response Codes
- 200 OK: Successful GET/PUT/PATCH
- 201 Created: Successful POST
- 204 No Content: Successful DELETE
- 400 Bad Request: Invalid input
- 404 Not Found: Resource doesn't exist
- 422 Unprocessable: Validation failed

## Example Implementation
\`\`\`typescript
app.get("/users/:id", async (req, res) => {
  const user = await db.users.findById(req.params.id)
  if (!user) return res.status(404).json({ error: "User not found" })
  res.json(user)
})
\`\`\`
```
