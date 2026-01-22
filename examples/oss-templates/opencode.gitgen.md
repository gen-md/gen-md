---
output:
context:
  - ./package.json
  - ./packages/opencode/package.json
  - ./packages/opencode/src/index.ts
  - ./packages/opencode/src/cli.ts
---
# OpenCode - Open source AI coding assistant

## Project Overview
OpenCode is an open-source AI-powered coding assistant that runs in your terminal. It provides an interactive REPL for code generation, refactoring, and explanation using various LLM providers. The tool integrates with your local development environment and understands project context.

## Tech Stack
- **Runtime**: Node.js / Bun
- **Language**: TypeScript (strict mode)
- **CLI Framework**: Ink (React for CLI)
- **AI Integration**: Multiple providers (OpenAI, Anthropic, local models)
- **Build**: tsup / esbuild
- **Package Manager**: pnpm workspaces

## Architecture

### Monorepo Structure
- `packages/opencode/` - Main CLI package
- `packages/core/` - Core AI and context logic
- `packages/providers/` - LLM provider implementations

### Key Modules
- `cli.ts` - Entry point, command handling
- `context.ts` - Project context gathering
- `providers/` - OpenAI, Anthropic, Ollama adapters
- `ui/` - Ink components for terminal UI

## Coding Conventions

### File Organization
- `src/` - TypeScript source
- `src/commands/` - CLI commands
- `src/providers/` - LLM provider implementations
- `src/ui/` - Terminal UI components
- `src/utils/` - Shared utilities

### Naming
- Functions: camelCase
- Types/Interfaces: PascalCase
- Files: kebab-case.ts
- Constants: UPPER_SNAKE_CASE
- Environment variables: OPENCODE_* prefix

### Code Style
- 2-space indentation
- Single quotes
- No semicolons
- Async/await patterns
- Functional React components for UI
- Zod for runtime validation

### CLI Pattern
```typescript
import { Command } from "commander"

export const chatCommand = new Command("chat")
  .description("Start interactive chat")
  .option("-m, --model <model>", "Model to use")
  .action(async (options) => {
    const provider = await getProvider(options.model)
    await startChat(provider)
  })
```

### Provider Pattern
```typescript
export interface Provider {
  name: string
  chat(messages: Message[]): AsyncIterable<string>
  complete(prompt: string): Promise<string>
}

export function createOpenAIProvider(config: Config): Provider {
  return {
    name: "openai",
    async *chat(messages) {
      const stream = await openai.chat.completions.create({
        messages,
        stream: true,
      })
      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content ?? ""
      }
    },
    // ...
  }
}
```

## Adding New Features

1. **Follow the provider interface** - New LLM providers implement Provider
2. **Use Ink for terminal UI** - React components render to terminal
3. **Add command to CLI** - Register with Commander
4. **Handle streaming** - Use async iterables for responses
5. **Add configuration** - Support environment variables and config files
