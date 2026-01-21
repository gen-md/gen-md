# gitgen Examples

Example projects demonstrating gitgen usage.

## Examples

| Example | Description |
|---------|-------------|
| [01-basic](./01-basic/) | Simple README generation from package.json |

## Quick Start

```bash
# Navigate to example
cd examples/01-basic

# Preview what would be generated
gitgen diff README.gitgen.md

# Generate the file
gitgen README.gitgen.md
```

## Creating Your Own

1. Create a `.gitgen.md` file:
   ```yaml
   ---
   output: README.md
   context:
     - ./package.json
   ---

   Generate a README with project overview and usage.
   ```

2. Generate:
   ```bash
   gitgen .
   ```
