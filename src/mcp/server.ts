#!/usr/bin/env node
/**
 * gen-md MCP Server
 *
 * Model Context Protocol server for gen-md tools.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  tools,
  type GenMdStatusInput,
  type GenMdDiffInput,
  type GenMdAddInput,
  type GenMdCommitInput,
  type GenMdInitInput,
} from "./tools.js";

import {
  initCommand,
  statusCommand,
  formatStatus,
  diffCommand,
  formatDiff,
  addCommand,
  commitCommand,
  validateCommand,
  formatValidate,
  cascadeCommand,
  formatCascade,
} from "../commands/index.js";
import { findGenMdRoot, createStore } from "../core/store.js";
import { createParser } from "../core/parser.js";
import { createResolver } from "../core/resolver.js";
import { relative } from "node:path";

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: "gen-md",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // List available resources (all .gen.md specs)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const root = await findGenMdRoot(process.cwd());
      if (!root) {
        return { resources: [] };
      }

      const store = createStore(root);
      const specPaths = await store.findAllSpecs();
      const parser = createParser();

      const resources = [];
      for (const specPath of specPaths) {
        try {
          const file = await parser.parse(specPath);
          const resolved = parser.resolveRelativePaths(file);
          const relPath = relative(root, specPath);

          resources.push({
            uri: `gen-md://spec/${relPath}`,
            name: resolved.frontmatter.name || relPath,
            description: resolved.frontmatter.description || `Spec for ${resolved.frontmatter.output || "unknown"}`,
            mimeType: "text/markdown",
          });
        } catch {
          // Skip specs that can't be parsed
        }
      }

      return { resources };
    } catch {
      return { resources: [] };
    }
  });

  // Read a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Parse the URI: gen-md://spec/path/to/file.gen.md
    const match = uri.match(/^gen-md:\/\/spec\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }

    const relPath = match[1];
    const root = await findGenMdRoot(process.cwd());
    if (!root) {
      throw new Error("Not a gen-md repository");
    }

    const specPath = `${root}/${relPath}`;
    const parser = createParser();
    const resolver = createResolver();

    try {
      const resolved = await resolver.resolve(specPath);

      // Build a comprehensive view of the spec
      const content = [
        `# ${resolved.frontmatter.name || relPath}`,
        "",
        resolved.frontmatter.description ? `> ${resolved.frontmatter.description}` : "",
        "",
        "## Frontmatter",
        "```yaml",
        `output: ${resolved.frontmatter.output || "not specified"}`,
        resolved.frontmatter.context?.length ? `context:\n${resolved.frontmatter.context.map(c => `  - ${c}`).join("\n")}` : "",
        resolved.frontmatter.skills?.length ? `skills:\n${resolved.frontmatter.skills.map(s => `  - ${s}`).join("\n")}` : "",
        "```",
        "",
        "## Instructions",
        resolved.body || "_No instructions provided_",
        "",
        resolved.examples.length > 0 ? "## Examples" : "",
        ...resolved.examples.map((ex, i) => [
          `### Example ${i + 1}`,
          "**Input:**",
          "```",
          ex.input,
          "```",
          "**Output:**",
          "```",
          ex.output,
          "```",
        ]).flat(),
        "",
        `## Cascade Chain (${resolved.chain.length} files)`,
        ...resolved.chain.map(f => `- ${relative(root, f.filePath)}`),
      ].filter(Boolean).join("\n");

      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read spec: ${(error as Error).message}`);
    }
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "gen_md_init": {
          const input = args as GenMdInitInput;
          const result = await initCommand({ path: input.path });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "gen_md_status": {
          const input = args as GenMdStatusInput;
          const result = await statusCommand({ path: input.path });
          const root = await findGenMdRoot(input.path || process.cwd());
          return {
            content: [
              {
                type: "text",
                text: formatStatus(result, root || process.cwd()),
              },
            ],
          };
        }

        case "gen_md_diff": {
          const input = args as unknown as GenMdDiffInput;
          const result = await diffCommand({
            spec: input.spec,
            cached: input.cached,
            git: input.git,
          });
          return {
            content: [
              {
                type: "text",
                text: formatDiff(result, false), // No ANSI colors for MCP
              },
            ],
          };
        }

        case "gen_md_add": {
          const input = args as unknown as GenMdAddInput;
          const result = await addCommand({
            file: input.file,
            description: input.description,
            name: input.name,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "gen_md_commit": {
          const input = args as GenMdCommitInput;
          const result = await commitCommand({
            message: input.message,
            git: input.git,
            dryRun: input.dryRun,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "gen_md_validate": {
          const input = args as { path?: string };
          const result = await validateCommand({ path: input.path });
          return {
            content: [
              {
                type: "text",
                text: formatValidate(result),
              },
            ],
          };
        }

        case "gen_md_cascade": {
          const input = args as { spec: string; full?: boolean };
          const result = await cascadeCommand({
            spec: input.spec,
            full: input.full,
          });
          return {
            content: [
              {
                type: "text",
                text: formatCascade(result),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle shutdown gracefully
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
