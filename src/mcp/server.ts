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
} from "../commands/index.js";
import { findGenMdRoot } from "../core/store.js";

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
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
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
