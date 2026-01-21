---
name: Changelog
description: Generate changelog from git history
output: CHANGELOG.md
---

Generate a changelog from recent git commits.

## Format

Use Keep a Changelog format:
- Group by version
- Categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Most recent version first

## Guidelines

- Summarize commits into user-facing changes
- Skip internal/maintenance commits
- Link to relevant issues/PRs when mentioned
- Use past tense ("Added", not "Add")

Note: Run with `gitgen diff --git` to include git context.
