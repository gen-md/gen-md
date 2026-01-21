---
name: Release Notes
description: Generate release notes for a version
output: releases/v2.0.0.md
---

Generate release notes for version 2.0.0.

## Format

```markdown
# Release v2.0.0

**Release Date:** [date]

## Highlights

[2-3 sentence summary]

## Breaking Changes

- List any breaking changes
- Include migration steps

## New Features

- Feature 1
- Feature 2

## Improvements

- Improvement 1
- Improvement 2

## Bug Fixes

- Fix 1
- Fix 2

## Contributors

Thank contributors

## Upgrade Guide

Step-by-step upgrade instructions
```

## Guidelines

- Be specific about changes
- Link to relevant documentation
- Include version comparisons where helpful

Note: Run with `gitgen diff --git` to include commit history.
