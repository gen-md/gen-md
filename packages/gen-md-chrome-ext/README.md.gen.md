---
name: gen-md-chrome-readme
description: Generate README for @gen-md/chrome-ext - Chrome extension for GitHub .gen.md file viewing
context:
  - "./package.json"
  - "./manifest.json"
  - "./src/content.ts"
  - "./src/background.ts"
  - "./src/popup.ts"
  - "./src/parser.ts"
  - "./src/github.ts"
  - "./src/types.ts"
output: README.md
---
<input>
Generate a README.md for the gen-md Chrome browser extension.

## Extension Info
- Name: @gen-md/chrome-ext
- Version: 0.1.0
- Manifest Version: 3
- Scope: GitHub.com file viewing and repository browsing

## Features

### 1. Content Script (content.ts)
Injects into GitHub pages (https://github.com/*)

**Info Panel** - When viewing a .gen.md file:
- Floating panel with frontmatter info
- Displays: name, description, output field
- Shows skills tags and context file tags
- Input block preview (first 500 chars)
- Copy to clipboard button
- Close button

**File Badges** - In repository file listings:
- Adds "gen-md" badge to .gen.md file links
- Visual identification in file trees

### 2. Background Service Worker (background.ts)
- Handles extension installation
- Updates action badge on .gen.md file detection
  - Badge: "✓" in green when viewing .gen.md file
  - Clears badge for other files
- Message handlers: GET_GEN_MD_INFO, COPY_TO_CLIPBOARD

### 3. Popup (popup.ts)
- Page status display (GitHub check)
- .gen.md file detection indicator
- Count of .gen.md files on current page
- Refresh button (reloads tab)
- Docs button (opens repo docs)

### 4. Parser (parser.ts)
Browser-compatible YAML-like frontmatter parser:
- `parseFrontmatter()` - Parse YAML frontmatter
- `parseGenMd()` - Full .gen.md parsing with validation
- `extractInputBlock()` - Extract <input> block content
- Handles: key-value pairs, arrays (dash-separated and inline)

### 5. GitHub Integration (github.ts)
- `getGitHubContext()` - Extract owner/repo/branch/path from URL
- `fetchRawContent()` - Fetch from raw.githubusercontent.com
- `isGenMdFile()` - Check if viewing .gen.md
- `findGenMdFilesInPage()` - Find .gen.md links on page

## Permissions
- `storage` - Local storage for settings
- `activeTab` - Active tab access
- Host permissions: `https://github.com/*`, `https://raw.githubusercontent.com/*`

## Include in README

1. Extension name and Chrome Web Store link (placeholder)
2. Features with screenshots placeholders
3. Installation: Chrome Web Store + manual (developer mode)
4. Permissions explanation
5. How it works on GitHub
6. Link to monorepo README
</input>
