---
output:
context:
  - ./package.json
  - ./apps/www/package.json
  - ./packages/cli/package.json
  - ./apps/www/registry/default/ui/button.tsx
---
# shadcn/ui - Beautifully designed components built with Radix UI and Tailwind CSS

## Project Overview
shadcn/ui is not a component library. It's a collection of re-usable components that you can copy and paste into your apps. Components are built on top of Radix UI primitives and styled with Tailwind CSS. The CLI tool lets you add components to your project.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Components**: Radix UI primitives
- **Animation**: Tailwind CSS animations + Framer Motion
- **CLI**: Node.js with Commander
- **Registry**: JSON registry of components

## Architecture

### Monorepo Structure
- `apps/www/` - Documentation site (Next.js)
- `packages/cli/` - The `npx shadcn` CLI
- `apps/www/registry/` - Component source registry

### Component Registry
Components are stored as JSON in the registry:
```json
{
  "name": "button",
  "dependencies": ["@radix-ui/react-slot"],
  "files": [{ "name": "button.tsx", "content": "..." }]
}
```

## Coding Conventions

### File Organization
- `apps/www/registry/default/ui/` - Default style components
- `apps/www/registry/new-york/ui/` - New York style components
- `apps/www/content/docs/` - MDX documentation
- `packages/cli/src/` - CLI source code

### Component Pattern
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "..." }
  },
  defaultVariants: { variant: "default", size: "default" }
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Code Style
- TypeScript strict mode
- 2-space indentation
- Double quotes
- No semicolons
- `cn()` utility for class merging
- `cva()` for component variants
- Radix primitives for accessibility

### Naming
- Components: PascalCase
- Files: kebab-case
- CSS variables: `--component-property` format
- Tailwind classes: Follow Tailwind conventions

## Adding New Components

1. **Build on Radix primitives** - Use existing Radix components
2. **Create both style variants** - Default and New York
3. **Add to registry** - Update registry JSON
4. **Write documentation** - Add MDX in content/docs/
5. **Include examples** - Show common use cases
6. **Test CLI installation** - Verify `npx shadcn add` works
