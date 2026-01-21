# GitGen Terminal Screenshots

## `gitgen --help`

```
Usage: gitgen [options] [command]

Git-like MCP for predictive version control using .gitgen.md specs

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  init [path]                Initialize a gitgen repository
  status [options]           Show status of .gitgen.md specs
  diff [options] <spec>      Show difference between current file and predicted
                             content
  add [options] <file>       Create a .gitgen.md spec for a file or stage an
                             existing spec
  commit [options]           Regenerate all staged specs and write output files
  watch [options]            Watch .gitgen.md files and auto-regenerate on
                             change
  cascade [options] <spec>   Show the cascade chain for a .gitgen.md spec
  validate [options] [path]  Validate .gitgen.md specs without making API calls
  help [command]             display help for command
```

## `gitgen status`

```
On branch: main

Changes not staged for commit:
  (use "gitgen add <spec>" to stage)
  (use "gitgen diff <spec>" to see what changed)

        modified: .gitgen.md -> README.md
```

## `gitgen validate`

```
✓ All 1 specs are valid
```

## `gitgen cascade .gitgen.md`

```
Cascade Chain

└── .gitgen.md
     frontmatter: name, description, skills, context, output
     body: Generate a README.md for gitgen.
     examples: 1

Resolved Configuration

  name: gitgen
  description: Generate README.md for gitgen CLI
  output: README.md
  context:
    - ./package.json
    - ./src/index.ts
    - ./src/mcp/server.ts
    - ./src/core/extensions.ts
    - ./src/core/prompt-loader.ts
    - ./src/core/predictor.ts
  skills:
    - ./.agent/skills/gen-md/SKILL.md
  examples: 1
  body: 75 words
```

## `gitgen init`

```
Initialized empty gitgen repository in /path/to/project/.gitgen
```

## `gitgen add README.md --description "Project docs"`

```
Created: README.gitgen.md
Staged: README.gitgen.md -> README.md
```
