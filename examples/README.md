# gitgen Examples

This folder contains example projects demonstrating different gitgen use cases.

## Examples

| Example | Description |
|---------|-------------|
| [01-basic](./01-basic/) | Minimal getting started example |
| [02-cascade](./02-cascade/) | Inheritance and cascade configuration |
| [03-documentation](./03-documentation/) | API docs and changelog generation |
| [04-infrastructure](./04-infrastructure/) | Dockerfile and CI/CD generation |
| [05-content](./05-content/) | Blog posts and release notes |
| [06-monorepo](./06-monorepo/) | Full monorepo with shared config |

## Quick Start

```bash
# Navigate to any example
cd examples/01-basic

# Validate the spec
gitgen validate README.gitgen.md

# Preview what would be generated
gitgen diff README.gitgen.md

# Generate the file
gitgen commit -m "Generate README"
```

## Running Examples

Each example is self-contained. To try one:

1. **Initialize gitgen** (if not already done in that directory):
   ```bash
   gitgen init
   ```

2. **Validate the spec**:
   ```bash
   gitgen validate <spec>.gitgen.md
   ```

3. **Preview changes**:
   ```bash
   gitgen diff <spec>.gitgen.md
   ```

4. **Generate**:
   ```bash
   gitgen commit -m "Generate file"
   ```

## Example Overview

### 01-basic
The simplest possible example. A single `.gitgen.md` file that generates a README from package.json context.

### 02-cascade
Demonstrates the inheritance system:
- Root `.gitgen.md` defines company-wide defaults (model, skills)
- Package-level `.gitgen.md` adds package-specific context
- Leaf spec inherits and merges everything

Run `gitgen cascade packages/api/README.gitgen.md` to see the full inheritance chain.

### 03-documentation
Technical documentation workflows:
- Generate API reference from source code
- Generate changelog from git history

### 04-infrastructure
DevOps file generation:
- Dockerfile from package.json
- GitHub Actions CI configuration

### 05-content
Non-code content generation:
- Blog post templates
- Release notes

### 06-monorepo
Real-world monorepo setup with:
- Shared root configuration
- Per-package specs
- Shared skills for consistent documentation style
