# gen-md

**gen-md** is a generative markdown framework that lets you define how files are generated using simple `.gen.md` prompts. It provides a standardized way to generate and regenerate files based on context, templates, and skills.

![gen-md Landing](./tests/e2e/screenshots/gen-md-landing.png)

## Why gen-md

Stop writing code for content generation. Instead, groom and cascade in-codebase knowledge for content generation, expansion, and verification. gen-md generates any type of content in a consistent and repeatable manner, from simple markdown files to complex codebases, using natural language.

## Features

- **File-Specific Prompts**: Each `.gen.md` file describes how to generate its corresponding file
- **Metadata-Driven**: Use a simple metadata header to define name, description, context, and skills
- **Context and Skills**: Reference other files or reusable skill modules to enrich the generation process
- **Git-Aware Generation**: Incorporate Git history to create more informed, contextual prompts
- **Cascading Context**: Define global `.gen.md` files in parent folders to apply common patterns
- **Compaction**: Merge multiple `.gen.md` files into a single consolidated generator
- **Validation**: Verify `.gen.md` files and confirm outputs exist and are aligned

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

## Packages

### @gen-md/core

Core library providing parsing, cascading resolution, compaction, and validation.

```bash
npm install @gen-md/core
```

```typescript
import {
  GenMdParser,
  CascadingResolver,
  Compactor,
  Validator
} from '@gen-md/core';

// Parse a .gen.md file
const parser = new GenMdParser();
const file = await parser.parse('./README.gen.md');

// Resolve cascade chain
const resolver = new CascadingResolver();
const resolved = await resolver.resolve('./packages/cli/README.gen.md');

// Compact multiple files
const compactor = new Compactor({ arrayMerge: 'dedupe' });
const merged = await compactor.compact(['a.gen.md', 'b.gen.md']);

// Validate files
const validator = new Validator();
const results = await validator.validateAll(['*.gen.md']);
```

### @gen-md/cli

Command-line interface for gen-md operations.

```bash
npm install -g @gen-md/cli
# or use via npx
npx gen-md <command>
```

### Extensions

| Package | Platform | Status |
|---------|----------|--------|
| `gen-md-vscode` | VS Code | In Development |
| `gen-md-chrom-ext` | Chrome | In Development |
| `gen-md-claude-code-plugin` | Claude Code | In Development |
| `gen-md-openai-custom-gpt` | ChatGPT | Planned |
| `gen-md-antigravity` | Google IDX | Planned |

## Monorepo Structure

```
gen-md/
├── packages/
│   ├── gen-md-core/          # Core library
│   │   ├── src/
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   ├── parser/       # .gen.md file parser
│   │   │   ├── resolver/     # Cascading resolver
│   │   │   ├── compactor/    # File merger & serializer
│   │   │   ├── validator/    # Validation system
│   │   │   └── __tests__/    # Unit tests
│   │   └── package.json
│   ├── gen-md-cli/           # CLI package
│   │   ├── src/
│   │   │   ├── commands/     # CLI commands
│   │   │   └── __tests__/    # Unit tests
│   │   ├── bin/
│   │   └── package.json
│   ├── gen-md-vscode/        # VS Code extension
│   ├── gen-md-chrom-ext/     # Chrome extension
│   └── ...
├── tests/
│   └── e2e/                  # Playwright E2E tests
│       ├── specs/
│       └── screenshots/
└── .agent/
    └── skills/
        └── gen-md/
            └── SKILL.md      # Generation skill
```

## Getting Started

### Installation

```bash
# Install CLI globally
npm install -g @gen-md/cli

# Or use via npx (no install required)
npx gen-md --help
```

### Quick Start

```bash
# Initialize a new repo with .gen.md
npx gen-md init .

# Create a generator for README
npx gen-md infer README.md

# Generate from .gen.md file
npx gen-md gen README.md

# Validate all generators
npx gen-md validate *.gen.md
```

## Cascading Configuration

Place a `.gen.md` file in any directory to define defaults that cascade to all generators in that directory and its subdirectories.

```
project/
  .gen.md                    # Root config: skills: ["base"]
  packages/
    .gen.md                  # Package config: skills: ["pkg-common"]
    cli/
      app.gen.md            # Target: skills: ["cli-skill"]
```

When resolving `app.gen.md`, the cascade chain merges configurations:

![Cascade Visualization](./tests/e2e/screenshots/gen-md-cascade.png)

**Merge Rules:**
- Scalar values: child overrides parent
- Arrays (context, skills): concatenate and deduplicate
- Body: append child to parent

Preview a cascade chain:
```bash
npx gen-md cascade ./packages/cli/app.gen.md --show-merged
```

## Compaction

Merge multiple `.gen.md` files into a single consolidated file:

```bash
npx gen-md compact file1.gen.md file2.gen.md -o merged.gen.md
```

**Options:**
| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file path (default: merged.gen.md) |
| `--array-merge <strategy>` | concatenate, dedupe, replace (default: dedupe) |
| `--body-merge <strategy>` | append, prepend, replace (default: append) |
| `--resolve-paths` | Convert relative paths to absolute |
| `--dry-run` | Preview output without writing |

## Validation

Validate `.gen.md` files to ensure outputs exist and references are valid:

```bash
npx gen-md validate *.gen.md
```

![Validation Output](./tests/e2e/screenshots/gen-md-validate.png)

**Options:**
| Option | Description |
|--------|-------------|
| `--no-check-output` | Skip checking if output files exist |
| `--no-check-context` | Skip checking if context files exist |
| `--no-check-skills` | Skip checking if skill files exist |
| `--json` | Output results as JSON |

## CLI Reference

| Command | Description |
|---------|-------------|
| `gen <file>` | Generate output from .gen.md (with cascading) |
| `init <dir>` | Initialize .gen.md for directory |
| `infer <file>` | Infer .gen.md from existing file |
| `compact <files...>` | Merge multiple .gen.md files |
| `cascade <file>` | Preview cascade chain |
| `validate <files...>` | Validate .gen.md files |

## Editor Integration

![Editor View](./tests/e2e/screenshots/gen-md-editor.png)

The gen-md editor provides:
- Split view with input (.gen.md) and output preview
- Syntax highlighting for YAML frontmatter
- Real-time generation preview
- Cascade chain visualization

## Testing

### Unit Tests

```bash
# Run core library tests
cd packages/gen-md-core && npm test

# Run CLI tests
cd packages/gen-md-cli && npm test
```

### E2E Tests

```bash
# Run Playwright E2E tests
cd tests/e2e && npm test

# Run with UI
npm run test:ui

# Run headed (visible browser)
npm run test:headed
```

## Platform Support

**AI Assistants** (desktop/mobile):
- ChatGPT, Claude, Gemini

**IDE Extensions**:
- VS Code, Google IDX, Claude Code, Cursor, Windsurf

**Browser Extensions**:
- Chrome, Firefox, Safari

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

This project is licensed under the MIT License.
