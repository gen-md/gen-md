---
name: Dockerfile
description: Generate production Dockerfile
output: Dockerfile
context:
  - ./package.json
---

Generate a production-ready Dockerfile for this Node.js application.

## Requirements

- Multi-stage build (builder + runtime)
- Use Node.js LTS Alpine image
- Install only production dependencies in final image
- Run as non-root user
- Expose the correct port from package.json scripts
- Include health check

## Best Practices

- Order layers for optimal caching
- Use .dockerignore patterns
- Minimize final image size
- Set appropriate environment variables
