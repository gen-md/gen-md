/**
 * MCP Tool Definitions
 *
 * Defines the tools exposed by the gen-md MCP server.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool definitions for the gen-md MCP
 */
export const tools: Tool[] = [
  {
    name: "gen_md_status",
    description:
      "Show status of .gen.md specs - which need regeneration, which are up to date. Like 'git status'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to check (default: current directory)",
        },
      },
    },
  },
  {
    name: "gen_md_diff",
    description:
      "Show difference between current file and predicted content from spec. Calls Anthropic API to generate prediction. Like 'git diff'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        spec: {
          type: "string",
          description: "Path to .gen.md file",
        },
        cached: {
          type: "boolean",
          description: "Show staged predictions (skip regeneration)",
        },
        git: {
          type: "boolean",
          description: "Include git context in prediction",
        },
      },
      required: ["spec"],
    },
  },
  {
    name: "gen_md_add",
    description:
      "Create a .gen.md spec for an existing file or stage a spec for commit. Like 'git add'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        file: {
          type: "string",
          description: "File to create spec for, or spec to stage",
        },
        description: {
          type: "string",
          description: "Description of what this file should contain (when creating new spec)",
        },
        name: {
          type: "string",
          description: "Name for the generator (when creating new spec)",
        },
      },
      required: ["file"],
    },
  },
  {
    name: "gen_md_commit",
    description:
      "Regenerate all staged specs using Anthropic API and write output files. Like 'git commit'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "Commit/generation message",
        },
        git: {
          type: "boolean",
          description: "Include git context in predictions",
        },
        dryRun: {
          type: "boolean",
          description: "Preview without writing files",
        },
      },
    },
  },
  {
    name: "gen_md_init",
    description:
      "Initialize a gen-md repository by creating the .gen-md directory. Like 'git init'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Directory to initialize (default: current directory)",
        },
      },
    },
  },
  {
    name: "gen_md_validate",
    description:
      "Validate .gen.md specs without making API calls. Checks for missing context files, invalid frontmatter, and other issues.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to validate (spec or directory, default: current directory)",
        },
      },
    },
  },
  {
    name: "gen_md_cascade",
    description:
      "Show the inheritance chain for a .gen.md spec. Helps debug cascading configuration issues.",
    inputSchema: {
      type: "object" as const,
      properties: {
        spec: {
          type: "string",
          description: "Path to .gen.md file",
        },
        full: {
          type: "boolean",
          description: "Show full content of each file",
        },
      },
      required: ["spec"],
    },
  },
];

/**
 * Tool input types
 */
export interface GenMdStatusInput {
  path?: string;
}

export interface GenMdDiffInput {
  spec: string;
  cached?: boolean;
  git?: boolean;
}

export interface GenMdAddInput {
  file: string;
  description?: string;
  name?: string;
}

export interface GenMdCommitInput {
  message?: string;
  git?: boolean;
  dryRun?: boolean;
}

export interface GenMdInitInput {
  path?: string;
}

export interface GenMdValidateInput {
  path?: string;
}

export interface GenMdCascadeInput {
  spec: string;
  full?: boolean;
}
